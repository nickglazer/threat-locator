const { app, BrowserWindow } = require('electron')
const path = require('path')
const netstat = require('node-netstat');
const fetch = require('node-fetch');
const util = require('util');
const { isIP } = require('net');
const exec = util.promisify(require('child_process').exec);

const apiURL = ipAddress => `http://ipwhois.app/json/${ipAddress}`;

let myLocation = null;
const memoizedLocations = new Map();
const memoizeLocation = async (remoteAddress) => {
  if (!isIP(remoteAddress) && !remoteAddress.startsWith('192.168')) {
    return;
  }

  const result = memoizedLocations.get(remoteAddress);
  if (result) {
    return result;
  }

  try {
    const response = await (await fetch(apiURL(remoteAddress))).json();
    const { longitude: long, latitude: lat } = response;
    if (!lat || !long) {
      return;
    }

    memoizedLocations.set(remoteAddress, [lat, long]);
    return [lat, long];
  } catch (err) {
    console.error('ERROR', err);
    return;
  }
};

const sendLocations = async (rows, win) => {
  if (!rows.length) {
    return;
  }

  const locations = [];
  for (row of rows) {
    const location = await memoizeLocation(row);
    if (location) {
      locations.push(location);
    }
  }
  win.webContents.send('updateLocations', JSON.stringify({ locations, myLocation }));
}

const updateLocations = async win => {
  const rows = [];

  netstat({ limit: 2, protocol: 'tcp', sync: true, done: () => sendLocations(rows, win) }, data => {
    if (data) {
      rows.push(data.remote.address);
    }
  });
}

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 650,
    height: 650,
    name: 'Threat Locator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // get this running computer's location
  const { stdout } = await exec(`dig TXT +short o-o.myaddr.l.google.com @ns1.google.com | awk -F'"' '{ print $2}'`);
  const myIP = stdout.substr(0, 13);
  if (isIP(myIP)) {
    myLocation = await memoizeLocation(myIP);
  }

  win.loadFile(path.join(__dirname, 'index.html'));

  updateLocations(win);

  setInterval(() => {
    updateLocations(win);
  }, 5000);
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  app.quit();
});
