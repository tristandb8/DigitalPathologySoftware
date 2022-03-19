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
        name: "Project 1",
      },
      selectedAnnotation: -1,
    };
  }

  executeNucleusDetection = () => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    const annotation = loadedFile.annotations[this.state.selectedAnnotation];
    if (!loadedFile) return;
    const x = sliceImageFromAnnotation(loadedFile, annotation);
    console.log(x);
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
      file.cellDetectChannel = file.idfArray.length - 1;

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
    // ipcRenderer.send("load-previous-image");

    ipcRenderer.on("get-channel-info", (event, fileContent) => {
      const loadedFile =
        this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
      if (!loadedFile) return;
      const dimensions = [loadedFile.width, loadedFile.height];
      ipcRenderer.send(
        "single-channel-info",
        loadedFile.idfArray[36].data,
        loadedFile.name,
        dimensions
      );
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
