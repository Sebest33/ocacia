document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([48.8566, 2.3522], 5); // center on France
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    fetch('/api/employees')
        .then(resp => resp.json())
        .then(data => {
            data.forEach(emp => {
                if (emp.latitude && emp.longitude) {
                    var marker = L.marker([emp.latitude, emp.longitude]).addTo(map);
                    marker.bindPopup('<b>' + emp.name + '</b><br>' + emp.role + '<br>' + emp.region);
                }
            });
        });
});
