var map = L.map('map', { worldCopyJump: false }).setView([0, 0], 0);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  noWrap: true,
}).addTo(map);

map.fitWorld();

const layerGroup = L.layerGroup().addTo(map);

window.api.receive('updateLocations', data => {
  console.log(data);
  const { locations, myLocation } = JSON.parse(data);
  layerGroup.clearLayers();
  if (myLocation) {
    L.marker(myLocation).addTo(layerGroup);
  }

  locations.forEach(loc => {
    if (myLocation) {
      L.polyline([loc, myLocation]).addTo(layerGroup);
    } else {
      L.marker(loc).addTo(layerGroup);
    }
  });
});
