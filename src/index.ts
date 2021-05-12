import * as L from "leaflet";

import "./index.css";

declare global {
  interface Window {
    api: { receive: (channel: string, func: (data: string) => void) => void };
  }
}

// type ConnectionState =
//   | "SYN_SEND"
//   | "SYN_RECEIVED"
//   | "ESTABLISHED"
//   | "LISTEN"
//   | "FIN_WAIT_1"
//   | "TIMED_WAIT"
//   | "CLOSE_WAIT"
//   | "FIN_WAIT_2"
//   | "LAST_ACK"
//   | "CLOSED";

// const connectionStateColors = new Map<ConnectionState, string>([
//   ["SYN_SEND", "#FFA3FD"],
//   ["SYN_RECEIVED", "#E391E1"],
//   ["ESTABLISHED", "#C67FC5"],
//   ["LISTEN", "#AA6DA9"],
//   ["FIN_WAIT_1", "#8E5B8D"],
//   ["TIMED_WAIT", "#714870"],
//   ["CLOSE_WAIT", "#553654"],
//   ["FIN_WAIT_2", "#392438"],
//   ["LAST_ACK", "#1C121C"],
//   ["CLOSED", "#000000"],
// ]);

const map = L.map("map", { worldCopyJump: false }).setView([0, 0], 0);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  noWrap: true,
}).addTo(map);

map.fitWorld();

const layerGroup = L.layerGroup().addTo(map);

window.api.receive("updateLocations", (data: string) => {
  const { locations, myLocation }: {locations: L.LatLngTuple[], myLocation: L.LatLngTuple} = JSON.parse(data);
  layerGroup.clearLayers();
  if (myLocation) {
    L.marker(myLocation).addTo(layerGroup);
  }
  if (!locations.length) {
    return;
  }

  // TODO add color to line for state
  locations.forEach(
    location => {
      // const color = connectionStateColors.get(state);
      const color = '#000000';
      if (myLocation) {
        L.polyline([location, myLocation], { color }).addTo(layerGroup);
      }
      // const marker = L.marker(location).addTo(layerGroup);
      // marker.bindTooltip(`PID${pid} : ${state}`).openTooltip();
    }
  );
});
