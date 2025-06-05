from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///employees.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'photos')

db = SQLAlchemy(app)

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    address = db.Column(db.String(256), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    role = db.Column(db.String(128))
    region = db.Column(db.String(128))
    email = db.Column(db.String(128))
    phone = db.Column(db.String(64))
    photo = db.Column(db.String(256))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'role': self.role,
            'region': self.region,
            'email': self.email,
            'phone': self.phone,
            'photo': url_for('static', filename=f'photos/{self.photo}') if self.photo else ''
        }

# Simple geocoding via Nominatim
GEOCODE_URL = 'https://nominatim.openstreetmap.org/search'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        name = request.form['name']
        address = request.form['address']
        role = request.form['role']
        region = request.form['region']
        email = request.form['email']
        phone = request.form['phone']
        photo_file = request.files.get('photo')
        photo_filename = None
        if photo_file and photo_file.filename:
            photo_filename = photo_file.filename
            path = os.path.join(app.config['UPLOAD_FOLDER'], photo_filename)
            photo_file.save(path)
        lat, lon = geocode(address)
        emp = Employee(name=name, address=address, latitude=lat, longitude=lon,
                       role=role, region=region, email=email, phone=phone, photo=photo_filename)
        db.session.add(emp)
        db.session.commit()
        return redirect(url_for('admin'))
    employees = Employee.query.all()
    return render_template('admin.html', employees=employees)

@app.route('/edit/<int:emp_id>', methods=['GET', 'POST'])
def edit(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    if request.method == 'POST':
        emp.name = request.form['name']
        emp.address = request.form['address']
        emp.role = request.form['role']
        emp.region = request.form['region']
        emp.email = request.form['email']
        emp.phone = request.form['phone']
        photo_file = request.files.get('photo')
        if photo_file and photo_file.filename:
            photo_filename = photo_file.filename
            path = os.path.join(app.config['UPLOAD_FOLDER'], photo_filename)
            photo_file.save(path)
            emp.photo = photo_filename
        lat, lon = geocode(emp.address)
        emp.latitude = lat
        emp.longitude = lon
        db.session.commit()
        return redirect(url_for('admin'))
    return render_template('edit.html', employee=emp)

@app.route('/delete/<int:emp_id>', methods=['POST'])
def delete(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    db.session.delete(emp)
    db.session.commit()
    return redirect(url_for('admin'))

@app.route('/api/employees')
def api_employees():
    emps = Employee.query.all()
    return jsonify([e.to_dict() for e in emps])

# Simple geocoder using Nominatim

def geocode(address):
    params = {
        'q': address,
        'format': 'json'
    }
    try:
        response = requests.get(GEOCODE_URL, params=params, headers={'User-Agent': 'ocacia-app'})
        data = response.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception:
        pass
    return None, None

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
