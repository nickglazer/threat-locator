import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
  "api", {
      receive: (channel: string, func: (...args: unknown[]) => void) => {
          const validChannels = ["updateLocations"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender`
              ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      },
  }
);
