import React, { Component } from "react";
import { tiffImage, sliceImageFromAnnotation } from "./utils/tiffModel";
import styled from "styled-components";
import DisplayPage from "./components/DisplayPage";
import RightPane from "./components/RightPane";
import LeftPane from "./components/LeftPane";
import "./App.css";

const { ipcRenderer } = window.require("electron");

class App extends Component {
  constructor(props) {
    super(props);
    this.displayPageRef = React.createRef(null);

    this.state = {
      loadedProject: {
        openFiles: [], // Files openened in any tab
        activeFile: -1, // The currently selected tab index
        // Admittedly this should be renamed at somepoint and all the save data in
        // openFiles may be moved here in order to keep data persistence
        filePaths: [], // Files that were opened
        cellDetectChannel: 0,
        name: "No Project Loaded",
      },
      nucleusDetectInfo: null,
      selectedAnnotation: -1,
    };
  }

  executeNucleusDetection = () => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    const annotation = loadedFile.annotations[this.state.selectedAnnotation];
    if (!loadedFile || this.state.nucleusDetectInfo != null) return;

    const imageData = sliceImageFromAnnotation(loadedFile, annotation);

    this.setState((prevState) => ({
      nucleusDetectInfo: {
        width: imageData.width,
        height: imageData.height,
        loadedFile: this.state.loadedProject.activeFile,
        selectedAnnotation: this.state.selectedAnnotation,
      },
    }));

    ipcRenderer.send(
      "single-channel-info",
      imageData.intArray,
      loadedFile.name,
      [imageData.width, imageData.height],
      this.state.loadedProject.name
    );
  };

  selectCellChannel = (e) => {
    const index = e.target.value;
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newFile = {
      ...loadedFile,
      cellDetectChannel: index,
    };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  selectTab = (index) => {
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, activeFile: index },
      selectedAnnotation: -1,
    }));
  };

  closeTab = (index) => {
    let newFiles = [...this.state.loadedProject.openFiles];
    // ipcRenderer.send('saveImage', newFiles);
    newFiles.splice(index, 1);
    let newActive =
      this.state.loadedProject.activeFile < index
        ? this.state.loadedProject.activeFile
        : Math.max(this.state.loadedProject.activeFile - 1, 0);
    this.setState((prevState) => ({
      loadedProject: {
        ...prevState.loadedProject,
        openFiles: newFiles,
        activeFile: newActive,
      },
      selectedAnnotation: -1,
    }));
  };

  addAnnotation = (annotation) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;

    annotation.name = `${annotation.type} ${loadedFile.annotations.length + 1}`;

    // Create copy of the new file
    let newFile = {
      ...loadedFile,
      annotations: [...loadedFile.annotations, annotation],
    };

    // Create a copy of the new openFiles array and set the new file
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;

    // Update the state of the loaded project with the new files array
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  removeAnnotation = (index) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newFile = {
      ...loadedFile,
      annotations: [...loadedFile.annotations],
    };
    newFile.annotations.splice(index, 1);
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleAnnotationChange = (index, key, value) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.annotations];
    let newAnnotation = { ...newArray[index] };
    newAnnotation[key] = value;
    newArray[index] = newAnnotation;
    let newFile = { ...loadedFile, annotations: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleChannelChange = (index, key, value) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel[key] = value;
    newArray[index] = newChannel;
    let newFile = { ...loadedFile, idfArray: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleSelectedAnnotationChange = (index) => {
    this.setState({
      selectedAnnotation: index,
    });
  };

  componentDidMount() {
    ipcRenderer.on("new-image", (event, fileContent, append) => {
      let file;

      if (fileContent.type === "tiff") {
        file = tiffImage(fileContent.data);
      } else if (fileContent.type === "image") {
        file = { type: "image", data: fileContent.data, annotations: [] };
      }

      file.path = fileContent.path;
      file.name = fileContent.name;

      // Check if the file path is already stored in the project
      for (const storedFile of this.state.loadedProject.filePaths) {
        if (storedFile.path === file.path) append = false;
      }

      // Check if the file is already opened (switch to the tab)
      let openIndex = -1;
      for (
        let index = 0;
        index < this.state.loadedProject.openFiles.length;
        index++
      ) {
        const openFile = this.state.loadedProject.openFiles[index];
        if (openFile.path === fileContent.path) {
          openIndex = index;
          append = false;
        }
      }

      this.setState((prevState) => ({
        loadedProject: {
          openFiles:
            openIndex === -1
              ? [...prevState.loadedProject.openFiles, file]
              : prevState.loadedProject.openFiles,
          activeFile:
            openIndex === -1
              ? prevState.loadedProject.openFiles.length
              : openIndex,
          filePaths: append
            ? [
                ...prevState.loadedProject.filePaths,
                { path: file.path, name: file.name },
              ]
            : prevState.loadedProject.filePaths,
          name: prevState.loadedProject.name,
        },
      }));

      if (this.displayPageRef.current?.canvasRef?.current)
        this.displayPageRef.current.canvasRef.current.resetView();
    });

    // We want this to change to load previous project
    // ipcRenderer.send("load-previous-project");

    // ------------------- Load Project: -------------------
    ipcRenderer.on(
      "send_title_and_open_files",
      (event, project_name, new_file_paths) => {
        // new_file_paths is null if the user created a new project.
        if (new_file_paths == null) {
          new_file_paths = [];
        }

        // Sets the new project title and file paths.       // NOT FINISHED. The files are saved on the left pane but do not open.
        this.setState((prevState) => ({
          loadedProject: {
            ...prevState.loadedProject,
            name: project_name,
            filePaths: new_file_paths,
          },
        }));
      }
    );

    // ------------------- Save Project: -------------------
    ipcRenderer.on("needSaveInfo", (event, fileContent) => {
      const projectName = this.state.loadedProject.name;
      const loadedFilePaths = this.state.loadedProject.filePaths;
      ipcRenderer.send("filePaths", projectName, loadedFilePaths);
    });

    // ------------------ Nucleus Detect: ------------------
    ipcRenderer.on("get-channel-info", (event, fileContent) => {
      const loadedFile =
        this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
      if (!loadedFile) return;
      const dimensions = [loadedFile.width, loadedFile.height];
      ipcRenderer.send(
        "single-channel-info",
        loadedFile.idfArray[36].data,
        loadedFile.name,
        dimensions,
        loadedFile.name
      );
    });

    // -------------- Nucleus Detect Results: --------------
    ipcRenderer.on("nucleus-detect-result-buffer", (event, nucleusBuffer) => {
      const detectionArray = new Uint32Array(nucleusBuffer.buffer);
      if (this.state.nucleusDetectInfo == null) return;
      const info = this.state.nucleusDetectInfo;
      console.log(info);
      const loadedFile = this.state.loadedProject.openFiles[info.loadedFile];
      if (loadedFile == null) return;
      const annotation = loadedFile.annotations[info.selectedAnnotation];

      if (annotation != null) {
        let newArray = [...loadedFile.annotations];
        let newAnnotation = { ...newArray[info.selectedAnnotation] };
        newAnnotation.nucleusDetection = {
          detectionArray,
          height: info.height,
          width: info.width,
        };
        newArray[info.selectedAnnotation] = newAnnotation;
        let newFile = { ...loadedFile, annotations: newArray };
        let newFiles = [...this.state.loadedProject.openFiles];
        newFiles[this.state.loadedProject.activeFile] = newFile;
        this.setState((prevState) => ({
          loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
          nucleusDetectInfo: null,
        }));
      } else {
        this.setState((prevState) => ({
          nucleusDetectInfo: null,
        }));
      }
    });

    // ----------------- Cytoplasm Detect: -----------------
    ipcRenderer.on("get_cytoplasm_info", (event, fileContent) => {
      ipcRenderer.send("cytoplasm_info", this.state.loadedProject.name);
    });

    // ------------------ Delete Project: ------------------
    ipcRenderer.on("delete_project", (event, project_name) => {
      if (project_name === this.state.loadedProject.name) {
        //Set to Default.
        this.setState((prevState) => ({
          loadedProject: {
            ...prevState.loadedProject,
            openFiles: [],
            activeFile: -1,
            filePaths: [],
            cellDetectChannel: 0,
            name: "No Project Loaded",
          },
        }));
      }
    });
  }

  render() {
    return (
      <div className="App">
        <Split>
          <LeftPane
            project={this.state.loadedProject}
            selectTab={this.selectTab}
            onAnnotationChange={this.handleAnnotationChange}
            selectAnnotation={this.handleSelectedAnnotationChange}
            selectedAnnotation={this.state.selectedAnnotation}
            removeAnnotation={this.removeAnnotation}
            executeNucleusDetection={this.executeNucleusDetection}
            selectCellChannel={this.selectCellChannel}
          />
          <DisplayPage
            ref={this.displayPageRef}
            project={this.state.loadedProject}
            selectAnnotation={this.handleSelectedAnnotationChange}
            selectedAnnotation={this.state.selectedAnnotation}
            addAnnotation={this.addAnnotation}
            closeTab={this.closeTab}
            selectTab={this.selectTab}
          />
          <RightPane
            project={this.state.loadedProject}
            onChannelChange={this.handleChannelChange}
          />
        </Split>
      </div>
    );
  }
}

export default App;

const Split = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 100vh;
`;
