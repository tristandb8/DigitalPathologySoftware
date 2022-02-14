const { app, BrowserWindow, Menu, dialog } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();
let { PythonShell } = require("python-shell");

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
          loadProject();
        },
      },
      {
        label: "Load Image",
        click() {
          loadImage();
        },
      },
      {
        label: "Save Project",
        accelerator: "CmdOrCtrl+S",
        click() {
          saveProject();
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
          // createObject(); // This isn't defined?
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
  mainWindow.webContents.send("new-image", { ...retval, path: file });
}

function openIntroFile() {
  const file = store.get("Directory") || null;
  if (file == null) return;
  if (!fs.existsSync(file)) return;
  const retval = inferFile(file);
  mainWindow.webContents.send("new-image", retval);
}

function makeDir() {
  const dir = path.join(os.homedir(), "Documents", "DPSoftware");
  if (!fs.existsSync(dir)) {
    console.log(dir);
    fs.mkdirSync(dir);
  }
}

function loadImage() {
  console.log("LOAD tiffImage.json");
  const dir = path.join(os.homedir(), "Documents", "DPSoftware");
  let rawdata = fs.readFileSync(path.resolve(dir, "tiffImage.json"));
  let image = JSON.parse(rawdata);
  console.log(image);
}

function loadProject() {
  console.log("LOAD savedProject.json");
  var dir = path.join(os.homedir(), "Documents", "DPSoftware");
  let rawdata = fs.readFileSync(path.resolve(dir, "savedProject.json"));
  let image = JSON.parse(rawdata);
  console.log(image);
}

function saveProject() {
  console.log("SAVE savedProject.json");
  // fs.writeFileSync(path.resolve(os.homedir()+'/Desktop/DPSoftware', 'tiffImage.json'), JSON.stringify(args));
}

function pythonScripts() {
  console.log("Testing Python Scripts");
  let pyshell = new PythonShell("./src/pythonScripts/test.py");

  // sends a message to the Python script via stdin
  pyshell.send("hello");

  pyshell.on("message", function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);
  });

  // end the input stream and allow the process to exit
  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    // console.log('The exit code was: ' + code);
    // console.log('The exit signal was: ' + signal);
    // console.log('finished');
  });
}

ipcMain.on("tiffImage", (event, args) => {
  const dir = path.join(os.homedir(), "Documents", "DPSoftware");
  fs.writeFileSync(path.resolve(dir, "tiffImage.json"), JSON.stringify(args));
  console.log("SAVE tiffImage.json");
});

ipcMain.on("saveProject", (event, args) => {
  const dir = path.join(os.homedir(), "Documents", "DPSoftware");
  fs.writeFileSync(
    path.resolve(dir, "savedProject.json"),
    JSON.stringify(args)
  );
  console.log("SAVE savedProject.json");
});
