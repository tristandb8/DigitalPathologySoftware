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
        label: "Save Project",
        accelerator: "CmdOrCtrl+S",
        click() {
          saveProject();
        },
      },
      {
        label: "Delete Project",
        click() {
          deleteProject();
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
          getCytoplasmInfo();
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
}

// Creates ZDFocus folder in 'Documents'.
function makeDir() {
  const dir = path.join(os.homedir(), "Documents", "ZDFocus");
  const dirTmp = path.join(os.homedir(), "Documents", "ZDFocus", "tmp");
  if (!fs.existsSync(dir)) {
    console.log(dir);
    fs.mkdirSync(dir);
  }
  if (!fs.existsSync(dirTmp)) {
    console.log(dirTmp);
    fs.mkdirSync(dirTmp);
  }
  const dirNucleus = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    "Detect Nucleus"
  );
  const dirCytoplasm = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    "Detect Cytoplasm"
  );
  if (!fs.existsSync(dirNucleus)) {
    console.log(dirNucleus);
    fs.mkdirSync(dirNucleus);
  }
  if (!fs.existsSync(dirCytoplasm)) {
    console.log(dirCytoplasm);
    fs.mkdirSync(dirCytoplasm);
  }
}

// User can select an image from their local computer and the data is sent to App.js
// by using the componentDidMount() function.
function openIntroProject() {
  const file = store.get("Directory") || null;
  if (file == null) return;
  if (!fs.existsSync(file)) return;
  let project_name = path.basename(file);
  let file_paths = store.get(project_name) || null;
  let parsed_file_paths = JSON.parse(file_paths);
  mainWindow.webContents.send(
    "send_title_and_open_files",
    project_name,
    parsed_file_paths
  );
}

// Loads the saved array2D.json object saved in 'ZDFocus'.
// function loadArray2D() {
//   console.log("LOAD 2D ARRAY...");

//   const files = dialog.showOpenDialogSync(mainWindow, {
//     properties: ["openFile", "multiSelections"],
//     filters: [
//       { name: "Images", extensions: ["json"] },
//     ],
//   });
//   let rawdata = fs.readFileSync(path.resolve(files[0]));
//   let array2D = JSON.parse(rawdata);
//   console.log('Height: ' + array2D.length);
//   console.log('Width: ' + array2D[0].length)
// }

// ------------------------------ LOAD PROJECT -------------------------------
function loadProject() {
  console.log("LOAD PROJECT...");
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: [
      "openDirectory",
      "multiSelections",
      "createDirectory", // For Mac
      "promptToCreate",
    ], // For Windows
  });
  if (!files) return;
  let project_name = path.basename(files[0]);

  let file_paths = store.get(project_name) || null;
  let parsed_file_paths = JSON.parse(file_paths);
  const dirNucleus = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    project_name,
    "Detect Nucleus"
  );
  const dirCytoplasm = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    project_name,
    "Detect Cytoplasm"
  );
  if (!fs.existsSync(dirNucleus)) {
    console.log(dirNucleus);
    fs.mkdirSync(dirNucleus);
  }
  if (!fs.existsSync(dirCytoplasm)) {
    console.log(dirCytoplasm);
    fs.mkdirSync(dirCytoplasm);
  }
  mainWindow.webContents.send(
    "send_title_and_open_files",
    project_name,
    parsed_file_paths
  );
}

// ------------------------------ SAVE PROJECT -------------------------------
function saveProject() {
  console.log("SAVE PROJECT...");
  mainWindow.webContents.send("getSaveInfo");

  ipcMain.on("sendSaveInfo", (event, project, tabs) => {
    // if project.name === <default name>
    //  prompt save window...
    const dir = path.join(os.homedir(), "Documents", "ZDFocus", project.name);

    const newFiles = new Map();
    for (const key of project.files.keys()) {
      const file = project.files.get(key);
      const newFile = { ...file };
      newFile.imageData = null;
      newFiles.set(key, newFile);
    }
    const saveProject = { ...project, files: newFiles, tabs: new Map(tabs) };

    // Creates a string from the JSON object that can be saved to store.
    let save_to_store = JSON.stringify(saveProject);
    store.set(project.name, save_to_store); // Saves the file paths to the project name.
    store.set("Directory", dir); // Saves the last project path of the last project saved.
    console.log("Directory Saved: ", dir);
  });
}

// ----------------------------- Delete PROJECT ------------------------------
function deleteProject() {
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ["openDirectory"],
  });
  if (!files) return;
  // delete directory recursively
  fs.rm(files[0], { recursive: true }, (err) => {
    if (err) {
      throw err;
    }

    console.log(`${files[0]} is deleted!`);
  });

  let project_name = path.basename(files[0]);
  console.log("Deleting :", project_name, " and removing from NPM-Store...");
  store.delete(project_name);
  mainWindow.webContents.send("delete_project", project_name);
}
// ------------------------------- Next three functions are used for NUCLEUS DETECTION -------------------------------
// Requests information from App.js, returns the last channel from the current open image.
function getSingleChannelInfo() {
  mainWindow.webContents.send("get-channel-info");
}

// Receives information from App.js and sends it to nucleiDetect().
ipcMain.on(
  "single-channel-info",
  (event, imageArray, imageTitle, dimensions, project_name) => {
    const dir = path.join(
      os.homedir(),
      "Documents",
      "ZDFocus",
      "tmp",
      "tmpLastChannel.json"
    );
    fs.writeFileSync(dir, JSON.stringify(imageArray));
    nucleiDetect(imageTitle, dimensions[0], dimensions[1], dir, project_name);
  }
);

function nucleiDetect(fileName, width, height, lastChannelPath, projectName) {
  console.log("Testing Nucleus Scripts...");

  // Paths used as arguments that will be sent into python scripts.
  const pathToh5 = path.join(
    process.cwd(),
    "src",
    "python",
    "mask_rcnn_cell_0030.h5"
  );

  const pathForTMPchannel = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    "tmp",
    "tmp.jpg"
  );

  const pathForResults =
    projectName !== "No Project Loaded"
      ? path.join(
          os.homedir(),
          "Documents",
          "ZDFocus",
          projectName,
          "Detect Nucleus",
          `${fileName}_nucleus_2D`
        )
      : path.join(
          os.homedir(),
          "Documents",
          "ZDFocus",
          "Detect Nucleus",
          `${fileName}_nucleus_2D`
        );

  // Pre-defined options and arguments that python-shell will read in.
  let options = {
    mode: "text",
    // I enable/disable this when on my (mike) machine
    // pythonPath:
    //   "C:/Users/monar/AppData/Local/Programs/Python/Python36/python.exe",
    pythonOptions: ["-u"], // get print results in real-time
    args: [
      pathToh5,
      lastChannelPath,
      width,
      height,
      pathForTMPchannel,
      fileName,
      projectName,
    ], //An argument which can be accessed in the script, index starts at 1, not 0.
  };

  const resultFn = (err, result) => {
    if (err) throw err;
    console.log("NUCLEI DETECT FINISHED...");
    const fileContent = fs.readFileSync(pathForResults);
    mainWindow.webContents.send("nucleus-detect-result-buffer", fileContent);
  };

  PythonShell.run("./src/python/NucleiDetect.py", options, resultFn);
}
// ------------------------------- Next three functions are used for CYTOPLASM DETECTION -------------------------------
// Requests information from App.js, returns the current open project.
function getCytoplasmInfo() {
  mainWindow.webContents.send("get_cytoplasm_info");
}

// Receives information from App.js and sends it to nucleiDetect().
ipcMain.on("single-channel-info-cyto", 
  (event, imageArray, imageTitle, dimensions, project_name, tiffFilePath) => {
    const dir = path.join(
      os.homedir(),
      "Documents",
      "ZDFocus",
      "tmp",
      "tmpLastChannel.json"
    );
    fs.writeFileSync(dir, JSON.stringify(imageArray));
    cytoplasmDetect(imageTitle, dimensions[0], dimensions[1], dir, project_name, tiffFilePath);
});

function cytoplasmDetect(fileName, width, height, lastChannelPath, projectName, tiffFilePath) {
  console.log("Testing Cytoplasm Scripts...");

  // Paths used as arguments that will be sent into python scripts.
  const pathToh5 = path.join(
    process.cwd(),
    "src",
    "python",
    "mask_rcnn_cell_0030.h5"
  );

  const pathForTMPchannel = path.join(
    os.homedir(),
    "Documents",
    "ZDFocus",
    "tmp",
    "tmp.jpg"
  );

  const pathForResults =
    projectName !== "No Project Loaded"
      ? path.join(
          os.homedir(),
          "Documents",
          "ZDFocus",
          projectName,
          "Detect Cytoplasm",
          `${fileName}_cyto_2D`
        )
      : path.join(
          os.homedir(),
          "Documents",
          "ZDFocus",
          "Detect Cytoplasm",
          `${fileName}_cyto_2D`
        );

  // Pre-defined options and arguments that python-shell will read in.
  let options = {
    mode: "text",
    // I enable/disable this when on my (mike) machine
    // pythonPath:
    //   "C:/Users/monar/AppData/Local/Programs/Python/Python36/python.exe",
    pythonOptions: ["-u"], // get print results in real-time
    args: [
      pathToh5,
      lastChannelPath,
      width,
      height,
      pathForTMPchannel,
      fileName,
      projectName,
      tiffFilePath
    ], //An argument which can be accessed in the script, index starts at 1, not 0.
  };

  const resultFn = (err, result) => {
    console.log(result);

    if (err) throw err;
    console.log("CYTO DETECT FINISHED...");
    const fileContent = fs.readFileSync(pathForResults);
    mainWindow.webContents.send("cytoplasm-detect-result-buffer", fileContent);
  };

  PythonShell.run("./src/python/Nuclei_cyto_detect.py", options, resultFn);
}



