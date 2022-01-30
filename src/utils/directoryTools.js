const path = window.require("path");
const fs = window.require("fs");
const Store = window.require("electron-store");
const store = new Store();

export function getFilePath() {
  let tmp = "";
  tmp = store.get("Directory") || null;
  return tmp;
}

export function setFilePath(file) {
  store.set("Directory", file);
}

export function setLoadedFileType(loadedFileType) {
  store.set("LOADEDFILETYPE", loadedFileType);
}

export function getLoadedFileType() {
  return store.get("LOADEDFILE");
}

export function setFile(loadedFile) {
  store.set("LOADEDFILE", loadedFile);
}

export function getFile() {
  return store.get("LOADEDFILE");
}

export function imageDecoder() {
  const file = getFilePath();
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
