const { app, BrowserWindow } = require('electron')
require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
});
function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 2000,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile('index.html')
  // win.setFullScreen(true)
}
app.whenReady().then(createWindow)