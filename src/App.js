import React, { Component } from "react";
import { tiffImage } from "./utils/tiffModel";
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
        filePaths: [], // Files that were opened
        name: "Project 1",
      },
      selectedAnnotation: -1,
    };
  }

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

      this.setState((prevState) => ({
        loadedProject: {
          openFiles: [...prevState.loadedProject.openFiles, file],
          activeFile: prevState.loadedProject.openFiles.length,
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
  align-items: stretch;
  height: 100vh;
`;
