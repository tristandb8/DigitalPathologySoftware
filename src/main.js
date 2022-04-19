const { app, BrowserWindow, Menu, dialog } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
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

  ipcMain.on("request-image-load", (event, path) => {
    let file = inferFile(path);
    if (file) mainWindow.webContents.send("new-image", file, false);
  });

  ipcMain.on(
    "cytoplasm-detection",
    (event, nucleusBuffer, tiffPath, info, annotation) => {
      console.log(nucleusBuffer);
      console.log(tiffPath);
      console.log(info);
      console.log(annotation);

      // EXECUTE CYTOPLASM DETECTION HERE
    }
  );

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
    projectName !== "Untitled Project"
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
    pythonPath:
      "C:/Users/monar/AppData/Local/Programs/Python/Python36/python.exe",
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

function cytoplasmDetect(
  fileName,
  width,
  height,
  lastChannelPath,
  projectName,
  tiffFilePath
) {
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
    projectName !== "Untitled Project"
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
      tiffFilePath,
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
