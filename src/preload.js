const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  "api", {
      receive: (channel, func) => {
          let validChannels = ["updateLocations"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender`
              ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      }
  }
);
