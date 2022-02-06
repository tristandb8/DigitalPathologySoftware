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
      },
    };
  }

  selectTab = (index) => {
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, activeFile: index },
    }));
  };

  closeTab = (index) => {
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles.splice(index, 1);
    let newActive =
      this.state.loadedProject.activeFile < index
        ? this.state.loadedProject.activeFile
        : this.state.loadedProject.activeFile - 1;
    this.setState((prevState) => ({
      loadedProject: {
        ...prevState.loadedProject,
        openFiles: newFiles,
        activeFile: newActive,
      },
    }));
  };

  addAnnotation = (annotation) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;

    // Create copy of the new file
    const newFile = {
      ...loadedFile,
      annotations: [...loadedFile.annotations, annotation],
    };

    // Create a copy of the new openFiles array and set the new file
    const newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;

    // Update the state of the loaded project with the new files array
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleChannelChange = (index, key, value) => {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item[key] = value;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  };

  handleChannelToggle = (index) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel.enabled = !newChannel.enabled;
    newArray[index] = newChannel;
    let newFile = { ...loadedFile, idfArray: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleChannelThresh = (index, range) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel.threshold = { min: range[0], max: range[1] };
    newArray[index] = newChannel;
    let newFile = { ...loadedFile, idfArray: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleChannelColor = (index, color) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel.channelColor = color;
    newArray[index] = newChannel;
    let newFile = { ...loadedFile, idfArray: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  handleChannelName = (index, name) => {
    const loadedFile =
      this.state.loadedProject.openFiles[this.state.loadedProject.activeFile];
    if (!loadedFile) return;
    let newArray = [...loadedFile.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel.name = name;
    newArray[index] = newChannel;
    let newFile = { ...loadedFile, idfArray: newArray };
    let newFiles = [...this.state.loadedProject.openFiles];
    newFiles[this.state.loadedProject.activeFile] = newFile;
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, openFiles: newFiles },
    }));
  };

  componentDidMount() {
    ipcRenderer.on("new-image", (event, fileContent) => {
      let file;

      if (fileContent.type === "tiff") {
        file = tiffImage(fileContent.data);
      } else if (fileContent.type === "image") {
        file = { type: "image", data: fileContent.data, annotations: [] };
      }

      this.setState((prevState) => ({
        loadedProject: {
          openFiles: [...prevState.loadedProject.openFiles, file],
          // The currently selected tab index
          activeFile: prevState.loadedProject.openFiles.length,
          // TODO: Store all opened file paths
          // filePaths: [...prevState.filePaths, filePath],
        },
      }));

      if (this.displayPageRef.current?.canvasRef?.current)
        this.displayPageRef.current.canvasRef.current.resetView();
    });

    ipcRenderer.send("load-previous-image");
  }

  render() {
    return (
      <div className="App">
        <Split>
          <LeftPane project={this.state.loadedProject} />
          <DisplayPage
            ref={this.displayPageRef}
            project={this.state.loadedProject}
            addAnnotation={this.addAnnotation}
            closeTab={this.closeTab}
            selectTab={this.selectTab}
          />
          <RightPane
            project={this.state.loadedProject}
            // Todo: Merge below functions
            onToggleChannel={this.handleChannelToggle}
            onThreshChannel={this.handleChannelThresh}
            onColorChannel={this.handleChannelColor}
            onNameChannel={this.handleChannelName}
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
