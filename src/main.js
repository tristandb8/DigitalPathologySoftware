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
        label: "Load 2D-Array",
        click() {
          loadArray2D();
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
  {
    label: "Detect",
    submenu: [
      {
        label: "Detect Nucleus",
        click() {
          getSingleChannelInfo();
        },
      },
      {
        label: "Detect Cytoplasm",
        click() {
          cytoplasmDetect();
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

  ipcMain.on("load-previous-project", (event) => {
    openIntroProject();
  });

  ipcMain.on("request-image-load", (event, path) => {
    let file = inferFile(path);
    if (file) mainWindow.webContents.send("new-image", file, false);
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
  retval.path = file;
  retval.name = path.basename(file);
  return retval;
}

function openFile() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "tif", "tiff"] },
    ],
  });
  if (!files) return;
  for (const file of files) {
    const retval = inferFile(file);
    mainWindow.webContents.send("new-image", retval, true);
  }
  store.set("Directory", files[files.length - 1]);
}

// Creates DPSoftware folder in 'Documents'.
function makeDir() {
  const dir = path.join(os.homedir(), "Documents", "DPSoftware");
  if (!fs.existsSync(dir)) {
    console.log(dir);
    fs.mkdirSync(dir);
  }
}

// User can select an image from their local computer and the data is sent to App.js
// by using the componentDidMount() function.
function openIntroProject() {
  const file = store.get("Directory") || null;
  if (file == null) return;
  if (!fs.existsSync(file)) return;
  const retval = inferFile(file);
  // Set "append" to true now, but in the future we will load the project instead
  mainWindow.webContents.send("new-image", retval, true);
}

// Loads the saved array2D.json object saved in 'DPSoftware'.
function loadArray2D() {
  console.log("LOAD 2D ARRAY...");

  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: ["json"] },
    ],
  });
  let rawdata = fs.readFileSync(path.resolve(files[0]));
  let array2D = JSON.parse(rawdata);
  console.log('Height: ' + array2D.length);
  console.log('Width: ' + array2D[0].length)
}


// ------------------------------ LOAD PROJECT -------------------------------
function loadProject() {
  console.log("LOAD PROJECT...");
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory", 
                 "multiSelections", 
                "createDirectory", // For Mac 
                "promptToCreate"], // For Windows
  });

  if (!files) return;
  let project_name = path.basename(files[0])

  let file_paths = store.get(project_name) || null;
  if (file_paths == null) return;
  let parsed_file_paths = JSON.parse(file_paths);
  mainWindow.webContents.send("send_title_and_open_files",project_name, parsed_file_paths);
}

// ------------------------------ SAVE PROJECT -------------------------------
function saveProject() {
  console.log("SAVE PROJECT...");
  mainWindow.webContents.send("needSaveInfo");
  ipcMain.on("filePaths", (event, project_name, file_paths) => {
    const dir = path.join(os.homedir(), "Documents", "DPSoftware",project_name);
    
    // Creates a string from the JSON object that can be saved to store.
    let save_to_store = JSON.stringify(file_paths);
    store.set(project_name, save_to_store); // Saves the file paths to the project name.
    store.set("Directory", dir);            // Saves the last project path of the last project saved.
  });
}

// ------------------------------- Next three functions are used for NUCLEUS DETECTION -------------------------------
// Requests information from App.js, returns the last channel from the current open image.
function getSingleChannelInfo() {
  mainWindow.webContents.send("get-channel-info");
}

// Receives information from App.js and sends it to nucleiDetect().
ipcMain.on(
  "single-channel-info",
  (event, imageArray, imageTitle, dimensions) => {
    // imageTitle = imageTitle.substr(0, imageTitle.lastIndexOf(".")) + ".json";
    let lastChannelPath = path.join(
      process.cwd(),
      "src",
      "python",
      "tmp",
      "tmpLastChannel.json"
    );
    fs.writeFileSync(lastChannelPath, JSON.stringify(imageArray));
    nucleiDetect(imageTitle, dimensions[0], dimensions[1], lastChannelPath);
  }
);

function nucleiDetect(fileName, width, height, lastChannelPath) {
  console.log("Testing Nucleus Scripts...");

  // Paths used as arguments that will be sent into python scripts.
  const pathToh5 = path.join(
    process.cwd(),
    "src",
    "python",
    "mask_rcnn_cell_0030.h5"
  );

  const pathForTMPchannel = path.join(
    process.cwd(),
    "src",
    "python",
    "tmp",
    "tmp.jpg"
  );

  // Pre-defined options and arguments that python-shell will read in.
  let options = {
    mode: "text",
    pythonOptions: ["-u"], // get print results in real-time
    args: [
      pathToh5,
      lastChannelPath,
      width,
      height,
      pathForTMPchannel,
      fileName,
    ], //An argument which can be accessed in the script, index starts at 1, not 0.
  };

  // I had to use this if-else statement because I could not get the './' added to src/python/NucleiDetect.py, would not work otherwise...
  if (isMac) {
    PythonShell.run(
      "./src/python/NucleiDetect.py",
      options,
      function (err, result) {
        if (err) throw err;
        console.log("NUCLEI DETECT FINISHED...");
      }
    );
  } else {
    PythonShell.run(
      "./src/python/NucleiDetect.py",
      options,
      function (err, result) {
        if (err) throw err;
        console.log("NUCLEI DETECT FINISHED...");
      }
    );
  }
}

// FUNCTION NOT COMPLETE
// ------------------------------ CYTOPLASM DETECTION -------------------------------
function cytoplasmDetect(){
  console.log("TESTING CYTOPLASM SCRIPTS...");

  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: ["json"] },
    ],
  });
  let options = {
    mode: 'text',
    pythonOptions: ['-u'], // get print results in real-time
    args: [files[0]] //An argument which can be accessed in the script using sys.argv[1]
  };

  PythonShell.run('./src/python/cytoplasm.py', options, function (err, result){
    if (err) throw err;
    // result is an array consisting of messages collected
    // during execution of script.
    console.log('#########################################');
    console.log('....       CYTOPLASM DETECTED        ....');
    console.log('#########################################');
    console.log(result)
    // fs.writeFileSync(path.join(os.homedir(), "Documents", "DPSoftware","Cells_Found.json"), JSON.stringify(result));
  });
}



// ipcMain.on("tiffImage", (event, args) => {
//   const dir = path.join(os.homedir(), "Documents", "DPSoftware");
//   // fs.writeFileSync(path.resolve(dir, "tiffImage.json"), JSON.stringify(args));
//   // console.log("SAVE tiffImage.json");
// });
// ipcMain.on("saveProject", (event, args) => {
//   const dir = path.join(os.homedir(), "Documents", "DPSoftware");
//   fs.writeFileSync(
//     path.resolve(dir, "savedProject.json"),
//     JSON.stringify(args)
//   );
//   console.log("SAVE savedProject.json");
// });