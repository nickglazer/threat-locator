import { app, BrowserWindow } from "electron";
import netstat from "node-netstat";
import fetch from "node-fetch";
import util from "util";
import { isIP } from "net";
import child_process from "child_process";
const exec = util.promisify(child_process.exec);

const apiURL = (ipAddress: string) => `http://ipwhois.app/json/${ipAddress}`;

let myLocation: L.LatLngTuple = null;
const memoizedLocations = new Map<string, L.LatLngTuple>();
const memoizeLocation = async (remoteAddress: string): Promise<L.LatLngTuple | null> => {
  if (!isIP(remoteAddress) && !remoteAddress.startsWith("192.168")) {
    return;
  }

  const result = memoizedLocations.get(remoteAddress);
  if (result) {
    return result;
  }

  try {
    const response: { latitude: number, longitude: number} = await (await fetch(apiURL(remoteAddress))).json();
    const { longitude: long, latitude: lat } = response;
    if (!lat || !long) {
      return;
    }

    memoizedLocations.set(remoteAddress, [lat, long]);
    return [lat, long];
  } catch (err) {
    console.error("ERROR", err);
    return;
  }
};

const sendLocations = async (rows: string[], win: BrowserWindow) => {
  if (!rows.length) {
    return;
  }

  const locations = [];
  for (const row of rows) {
    const location = await memoizeLocation(row);
    if (location) {
      locations.push(location);
    }
  }
  win.webContents.send(
    "updateLocations",
    JSON.stringify({ locations, myLocation })
  );
};

const updateLocations = async (win: BrowserWindow) => {
  const rows: string[] = [];

  netstat(
    {
      filter: {
        protocol: "tcp",
      },
      limit: 2,
      sync: true,
      done: () => sendLocations(rows, win),
    },
    (data) => {
      if (data) {
        rows.push(data.remote.address);
      }
    }
  );
};

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 650,
    height: 650,
    title: "Threat Locator",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // get this running computer's location
  const { stdout } = await exec(
    `dig TXT +short o-o.myaddr.l.google.com @ns1.google.com | awk -F'"' '{ print $2}'`
  );
  const myIP = stdout.substr(0, 13);
  if (isIP(myIP)) {
    myLocation = await memoizeLocation(myIP);
  }

  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  updateLocations(win);

  setInterval(() => {
    updateLocations(win);
  }, 5000);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
