document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map').setView([48.8566, 2.3522], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var employees = [];
    var markers = {};

    function loadEmployees() {
        fetch('/api/employees')
            .then(resp => resp.json())
            .then(data => {
                employees = data;
                renderEmployees();
                fillTable();
            });
    }

    function renderEmployees() {
        Object.values(markers).forEach(m => map.removeLayer(m));
        markers = {};
        employees.forEach(emp => {
            if (emp.latitude && emp.longitude) {
                var icon = emp.photo ? L.icon({
                    iconUrl: emp.photo,
                    iconSize: [40, 40],
                    className: 'emp-icon'
                }) : undefined;
                var marker = L.marker([emp.latitude, emp.longitude], { icon: icon }).addTo(map);
                marker.bindPopup(`<b>${emp.name}</b><br>${emp.role || ''}<br>${emp.region || ''}<br><button data-id="${emp.id}" class="editBtn">Edit</button> <button data-id="${emp.id}" class="deleteBtn">Delete</button>`);
                markers[emp.id] = marker;
            }
        });
    }

    function fillTable() {
        var tbody = document.querySelector('#employeeTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        employees.forEach(emp => {
            var tr = document.createElement('tr');
            tr.innerHTML = `<td>${emp.name}</td><td>${emp.address}</td><td>${emp.role || ''}</td><td>${emp.region || ''}</td><td>${emp.email || ''}</td><td>${emp.phone || ''}</td><td>${emp.photo ? '<img src="' + emp.photo + '" width="40">' : ''}</td><td><button class="editBtn" data-id="${emp.id}">Edit</button> <button class="deleteBtn" data-id="${emp.id}">Delete</button></td>`;
            tbody.appendChild(tr);
        });
    }

    document.body.addEventListener('click', function (e) {
        if (e.target.classList.contains('editBtn')) {
            var id = e.target.getAttribute('data-id');
            var emp = employees.find(emp => emp.id == id);
            if (emp) {
                showAdmin(true);
                var form = document.getElementById('employeeForm');
                form.empId.value = emp.id;
                form.name.value = emp.name;
                form.address.value = emp.address;
                form.role.value = emp.role || '';
                form.region.value = emp.region || '';
                form.email.value = emp.email || '';
                form.phone.value = emp.phone || '';
            }
        }
        if (e.target.classList.contains('deleteBtn')) {
            if (confirm('Delete this employee?')) {
                var id = e.target.getAttribute('data-id');
                fetch('/api/employees/' + id, { method: 'DELETE' })
                    .then(() => loadEmployees());
            }
        }
    });

    document.getElementById('toggleAdmin').addEventListener('click', function () {
        showAdmin();
    });

    function showAdmin(force) {
        var panel = document.getElementById('adminPanel');
        if (force === true) {
            panel.style.display = 'block';
        } else if (force === false) {
            panel.style.display = 'none';
        } else {
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        }
    }

    document.getElementById('employeeForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var form = e.target;
        var id = form.empId.value;
        var data = new FormData(form);
        var url = '/api/employees';
        var method = 'POST';
        if (id) {
            url += '/' + id;
            method = 'PUT';
        }
        fetch(url, { method: method, body: data })
            .then(() => {
                form.reset();
                form.empId.value = '';
                loadEmployees();
                showAdmin(false);
            });
    });

    loadEmployees();
});
