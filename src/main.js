const { app, BrowserWindow, Menu, dialog } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const os = require('os');
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();
let {PythonShell} = require('python-shell')

const isMac = process.platform === "darwin";

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  // { role: 'fileMenu' }
  {
    label: "File",
    submenu: [
      {
        label: "Open File",
        accelerator: "CmdOrCtrl+O",
        click() {
          openFile();
        },
      },
      {
        label: "Load Project",
        accelerator: "CmdOrCtrl+L",
        click() {
          loadObject();
        },
      },
      {
        label: "Save Project",
        accelerator: "CmdOrCtrl+S",
        click() {
          saveObject();
        },
      },
    ],
  },
  // { role: 'editMenu' }
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...(isMac
        ? [
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
              label: "Speech",
              submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
          ]
        : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
            { type: "separator" },
            { role: "front" },
            { type: "separator" },
            { role: "window" },
          ]
        : [{ role: "close" }]),
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://electronjs.org");
        },
      },
    ],
  },
    // { role: 'temp buttons for testing' }
    {
      label: "TEST",
      submenu: [
        {
          label: "TEST Create Object",
          click() {
            createObject();
          },
        },
        {
          label: "TEST Load Project",
          click() {
            loadProject();
          },
        },
        {
          label: "TEST Python",
          click() {
            pythonScripts();
          },
        },
      ],
    },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.loadURL("http://localhost:3000");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on("load-previous-image", (event) => {
    openIntroFile();
  });
  makeDir();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (!isMac) app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function inferFile(file) {
  const fileType = path.extname(file);
  const imgBuffer = fs.readFileSync(file);
  let retval;

  if (fileType === ".tif" || fileType === ".tiff") {
    retval = { type: "tiff", data: imgBuffer };
  } else {
    const imgDecode = imgBuffer.toString("base64");
    retval = { type: "image", data: `data:image;base64,${imgDecode}` };
  }

  return retval;
}

function openFile() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "tif", "tiff"] },
    ],
  });

  if (!files) return;
  const file = files[0];
  const retval = inferFile(file);
  store.set("Directory", file);
  mainWindow.webContents.send("new-image", retval);
}

function openIntroFile() {
  const file = store.get("Directory") || null;
  if (file == null) return;
  if (!fs.existsSync(file)) return;
  const retval = inferFile(file);
  mainWindow.webContents.send("new-image", retval);
}

function createObject(){
  console.log("Creating Object");
  let student = { 
      name: 'Ryan',
      age: 26, 
      gender: 'Male',
      role: 'DPS'
  };

  var dir = os.homedir()+'/Desktop/DPSoftware';
  console.log(dir);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  fs.writeFileSync(path.resolve(dir, 'student.json'), JSON.stringify(student));
}

function loadObject(){
  console.log("Loading Object");
  var dir = os.homedir()+'/Desktop/DPSoftware';
  let rawdata = fs.readFileSync(path.resolve(dir, 'tiffImage.json'));
  let image = JSON.parse(rawdata);
  console.log(image);

}

function loadProject(){
  console.log("Loading Project");
  var dir = os.homedir()+'/Desktop/DPSoftware';
  let rawdata = fs.readFileSync(path.resolve(dir, 'savedProject.json'));
  let image = JSON.parse(rawdata);
  console.log(image);

}

function saveObject(){
  console.log("Saving Object");

}

function pythonScripts(){
  console.log("Testing Python Scripts");
  let pyshell = new PythonShell('./src/pythonScripts/test.py');

  // sends a message to the Python script via stdin
  pyshell.send('hello');
  
  pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);
  });
  
  // end the input stream and allow the process to exit
  pyshell.end(function (err,code,signal) {
    if (err) throw err;
    // console.log('The exit code was: ' + code);
    // console.log('The exit signal was: ' + signal);
    // console.log('finished');
  });
}

function makeDir(){
  var dir = os.homedir()+'/Desktop/DPSoftware';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
}

ipcMain.on('tiffImage', (event, args) => {
  fs.writeFileSync(path.resolve(os.homedir()+'/Desktop/DPSoftware', 'tiffImage.json'), JSON.stringify(args));
 });

 ipcMain.on('saveImage', (event, args) => {
  fs.writeFileSync(path.resolve(os.homedir()+'/Desktop/DPSoftware', 'savedProject.json'), JSON.stringify(args));
 });