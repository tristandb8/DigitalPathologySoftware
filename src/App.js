import React, { Component } from "react";
import { tiffImage, sliceImageFromAnnotation } from "./utils/tiffModel";
import { getAnnotationFill, Square } from "./utils/annotations";
import styled from "styled-components";
import DisplayPage from "./components/DisplayPage";
import RightPane from "./components/RightPane";
import LeftPane from "./components/LeftPane";
import { projectFile } from "./utils/projectFile";
import "./App.css";

const { ipcRenderer } = window.require("electron");

class App extends Component {
  constructor(props) {
    super(props);
    this.displayPageRef = React.createRef(null);
    this.intervalID = null;

    this.state = {
      loadedProject: {
        activeFile: null, // String of file path for indexing in files
        files: new Map(), // Map of (file path, projectFile)
        name: "Untitled Project",
        compositeOp: "screen",
      },
      tabs: new Map(), // Open tabs (path, path) (could be a set but I'd have to make changes)
      nucleusDetectInfo: null,
      cytoplasmDetectInfo: null,
      nucleusRuntime: 0,
      cytoplasmRuntime: 0,
      selectedAnnotation: 0,
    };
  }

  executeCytoDetection = () => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (
      !loadedFile ||
      this.state.cytoplasmDetectInfo != null ||
      loadedFile.nucleusDetection === null
    )
      return;
    const annotation = loadedFile.annotations[this.state.selectedAnnotation];
    if (annotation === null) return;
    const annotationJSON = JSON.stringify(annotation);

    let activeChannels = [];
    for (let i = 0; i < loadedFile.imageData.idfArray.length; i++)
      if (
        loadedFile.imageData.idfArray[i].enabled &&
        i !== loadedFile.cellDetectChannel
      )
        activeChannels.push(i);

    this.intervalID = setInterval(() => {
      if (this.state.cytoplasmDetectInfo)
        this.setState((prevState) => ({
          cytoplasmRuntime:
            Date.now() - prevState.cytoplasmDetectInfo.startTime,
        }));
    }, 1000);

    this.setState((prevState) => ({
      cytoplasmDetectInfo: {
        width: loadedFile.imageData.width,
        height: loadedFile.imageData.height,
        channels: activeChannels,
        loadedFile: this.state.loadedProject.activeFile,
        startTime: Date.now(),
      },
    }));

    const info = {
      channels: activeChannels,
      names: loadedFile.channelNames,
    };

    ipcRenderer.send(
      "cytoplasm-detection",
      loadedFile.nucleusDetection.detectionArray.buffer,
      this.state.loadedProject.activeFile,
      info,
      annotationJSON
    );
  };

  executeNucleusDetection = () => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile || this.state.nucleusDetectInfo != null) return;

    const imageData = new Uint8ClampedArray(
      loadedFile.imageData.idfArray[loadedFile.cellDetectChannel].data
    );

    this.intervalID = setInterval(() => {
      if (this.state.nucleusDetectInfo)
        this.setState((prevState) => ({
          nucleusRuntime: Date.now() - prevState.nucleusDetectInfo.startTime,
        }));
    }, 1000);

    this.setState((prevState) => ({
      nucleusDetectInfo: {
        width: loadedFile.imageData.width,
        height: loadedFile.imageData.height,
        loadedFile: this.state.loadedProject.activeFile,
        startTime: Date.now(),
      },
    }));

    ipcRenderer.send(
      "single-channel-info",
      imageData,
      loadedFile.name,
      [loadedFile.imageData.width, loadedFile.imageData.height],
      this.state.loadedProject.name
    );
  };

  selectCellChannel = (e) => {
    const index = parseInt(e.target.value);
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile) return;
    let newFile = {
      ...loadedFile,
      cellDetectChannel: index,
    };
    let newFiles = new Map(this.state.loadedProject.files);
    newFiles.set(this.state.loadedProject.activeFile, newFile);
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, files: newFiles },
    }));
  };

  selectTab = (key) => {
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, activeFile: key },
      selectedAnnotation: 0,
    }));
  };

  closeTab = (key) => {
    let newTabs = new Map(this.state.tabs);
    const oldTabs = [...newTabs.keys()];
    const keyIndex = oldTabs.indexOf(key);
    const activeIndex = oldTabs.indexOf(this.state.loadedProject.activeFile);
    newTabs.delete(key);

    // TODO: Set tab to some adjacent tab
    let newActive = activeIndex;
    if (keyIndex === activeIndex) newActive = activeIndex - 1;
    newActive = oldTabs[newActive];

    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, activeFile: newActive },
      tabs: newTabs,
      selectedAnnotation: 0,
    }));
  };

  selectCompositeOp = (e) => {
    this.setState((prevState) => ({
      loadedProject: {
        ...prevState.loadedProject,
        compositeOp: e.target.value,
      },
    }));
  };

  addAnnotation = (annotation) => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile) return;

    annotation.name = `${annotation.type} ${loadedFile.annotations.length + 1}`;
    annotation.useNucleusDetection = loadedFile.nucleusDetection != null;

    getAnnotationFill(annotation, loadedFile.nucleusDetection).then((fill) => {
      if (annotation.fill.close) annotation.fill.close();
      annotation.fill = fill;
      let newArray = [...loadedFile.annotations, annotation];
      let newFile = { ...loadedFile, annotations: newArray };
      let newFiles = new Map(this.state.loadedProject.files);
      newFiles.set(this.state.loadedProject.activeFile, newFile);
      this.setState((prevState) => ({
        loadedProject: { ...prevState.loadedProject, files: newFiles },
        selectedAnnotation: newFile.annotations.length - 1,
      }));
    });
  };

  removeAnnotation = (index) => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile || this.state.nucleusDetectInfo) return;

    let newFile = {
      ...loadedFile,
      annotations: [...loadedFile.annotations],
    };
    newFile.annotations.splice(index, 1);
    let newFiles = new Map(this.state.loadedProject.files);
    newFiles.set(this.state.loadedProject.activeFile, newFile);
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, files: newFiles },
      selectedAnnotation: 0,
    }));
  };

  handleAnnotationChange = (index, key, value) => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile) return;

    let newArray = [...loadedFile.annotations];
    let newAnnotation = { ...newArray[index] };
    newAnnotation[key] = value;

    if (key === "color" || key === "useNucleusDetection") {
      getAnnotationFill(newAnnotation, loadedFile.nucleusDetection).then(
        (fill) => {
          if (newAnnotation.fill.close) newAnnotation.fill.close();
          newAnnotation.fill = fill;
          newArray[index] = newAnnotation;
          let newFiles = new Map(this.state.loadedProject.files);
          let newFile = { ...loadedFile, annotations: newArray };
          newFiles.set(this.state.loadedProject.activeFile, newFile);
          this.setState((prevState) => ({
            loadedProject: { ...prevState.loadedProject, files: newFiles },
          }));
        }
      );
    } else {
      newArray[index] = newAnnotation;
      let newFiles = new Map(this.state.loadedProject.files);
      let newFile = { ...loadedFile, annotations: newArray };
      newFiles.set(this.state.loadedProject.activeFile, newFile);
      this.setState((prevState) => ({
        loadedProject: { ...prevState.loadedProject, files: newFiles },
      }));
    }
  };

  renameChannel = (index, newName) => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile) return;

    let newChannels = [...loadedFile.channelNames];
    newChannels[index] = newName;
    const newFile = { ...loadedFile, channelNames: newChannels };
    let newFiles = new Map(this.state.loadedProject.files);
    newFiles.set(this.state.loadedProject.activeFile, newFile);
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, files: newFiles },
    }));
  };

  handleChannelChange = (index, key, value) => {
    const loadedFile = this.state.loadedProject.files.get(
      this.state.loadedProject.activeFile
    );
    if (!loadedFile) return;

    let newArray = [...loadedFile.imageData.idfArray];
    let newChannel = { ...newArray[index] };
    newChannel[key] = value;
    newArray[index] = newChannel;
    let newFile = {
      ...loadedFile,
      imageData: { ...loadedFile.imageData, idfArray: newArray },
    };
    let newFiles = new Map(this.state.loadedProject.files);
    newFiles.set(this.state.loadedProject.activeFile, newFile);
    this.setState((prevState) => ({
      loadedProject: { ...prevState.loadedProject, files: newFiles },
    }));
  };

  handleSelectedAnnotationChange = (index) => {
    this.setState({
      selectedAnnotation: index,
    });
  };

  componentDidMount() {
    ipcRenderer.on("new-image", (event, fileContent, append) => {
      let imageData, cellDetectChannel;

      if (fileContent.type === "tiff") {
        imageData = tiffImage(fileContent.data);
        cellDetectChannel = imageData.channels - 1;
      } else if (fileContent.type === "image") {
        imageData = fileContent.data;
        cellDetectChannel = -1;
      }

      const file = projectFile(
        fileContent.type,
        fileContent.name,
        fileContent.path,
        cellDetectChannel,
        imageData
      );

      if (this.state.tabs.get(file.path)) {
        this.setState((prevState) => ({
          loadedProject: {
            ...prevState.loadedProject,
            activeFile: file.path,
          },
          selectedAnnotation: 0,
        }));
        return;
      }

      const backgroundAnnotation = Square(
        0,
        0,
        file.imageData.width,
        file.imageData.height,
        "Background"
      );
      backgroundAnnotation.useNucleusDetection = false;

      file.annotations.push(backgroundAnnotation);

      const newFiles = new Map(this.state.loadedProject.files);
      newFiles.set(file.path, file);
      const newTabs = new Map(this.state.tabs);
      newTabs.set(file.path, file.path);

      this.setState((prevState) => ({
        loadedProject: {
          ...prevState.loadedProject,
          activeFile: file.path,
          files: newFiles,
        },
        selectedAnnotation: 0,
        tabs: newTabs,
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
    ipcRenderer.on("getSaveInfo", (event, fileContent) => {
      ipcRenderer.send(
        "sendSaveInfo",
        this.state.loadedProject,
        this.state.tabs
      );
    });

    // ------------------ Nucleus Detect: ------------------
    ipcRenderer.on("get-channel-info", (event, fileContent) => {
      const loadedFile = this.state.loadedProject.files.get(
        this.state.loadedProject.activeFile
      );
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
      const detectionArray = new Int32Array(nucleusBuffer.buffer);
      const info = this.state.nucleusDetectInfo;
      if (info == null) return;
      const loadedFile = this.state.loadedProject.files.get(info.loadedFile);

      if (loadedFile == null) {
        clearInterval(this.intervalID);
        this.setState((prevState) => ({
          nucleusDetectInfo: null,
          nucleusRuntime: 0,
        }));
        return;
      }

      let newFile = {
        ...loadedFile,
        nucleusDetection: {
          detectionArray,
          width: loadedFile.imageData.width,
          height: loadedFile.imageData.height,
        },
      };

      let newFiles = new Map(this.state.loadedProject.files);
      newFiles.set(info.loadedFile, newFile);

      clearInterval(this.intervalID);
      this.setState((prevState) => ({
        loadedProject: { ...prevState.loadedProject, files: newFiles },
        nucleusDetectInfo: null,
        nucleusRuntime: 0,
      }));
    });

    // ----------------- Cytoplasm Detect: -----------------
    ipcRenderer.on("get_cytoplasm_info", (event) => {
      const loadedFile = this.state.loadedProject.files.get(
        this.state.loadedProject.activeFile
      );
      const annotation = loadedFile.annotations[0];
      if (!loadedFile || this.state.cytoplasmDetectInfo != null) return;

      const imageData = sliceImageFromAnnotation(
        loadedFile.imageData,
        loadedFile.cellDetectChannel,
        annotation
      );

      this.intervalID = setInterval(() => {
        if (this.state.nucleusDetectInfo)
          this.setState((prevState) => ({
            cytoplasmRuntime:
              Date.now() - prevState.nucleusDetectInfo.startTime,
          }));
      }, 1000);

      this.setState((prevState) => ({
        cytoplasmDetectInfo: {
          width: imageData.width,
          height: imageData.height,
          loadedFile: this.state.loadedProject.activeFile,
          selectedAnnotation: this.state.selectedAnnotation,
          startTime: Date.now(),
        },
      }));

      ipcRenderer.send(
        "single-channel-info-cyto",
        imageData.intArray,
        loadedFile.name,
        [imageData.width, imageData.height],
        this.state.loadedProject.name,
        this.state.loadedProject.activeFile
      );
    });

    // -------------- Cytoplasm Detect Results: --------------
    ipcRenderer.on(
      "cytoplasm-detect-result-buffer",
      (event, cytoplasmBuffer) => {
        console.log(cytoplasmBuffer);
        const detectionArray = new Uint32Array(cytoplasmBuffer.buffer);
        const info = this.state.cytoplasmDetectInfo;
        if (info == null) return;
        const loadedFile = this.state.loadedProject.files.get(info.loadedFile);
        console.log(loadedFile);
        if (loadedFile == null) return;

        clearInterval(this.intervalID);
        this.setState((prevState) => ({
          // loadedProject: { ...prevState.loadedProject, files: newFiles },
          cytoplasmDetectInfo: null,
          cytoplasmRuntime: 0,
        }));
      }
    );

    // ------------------ Delete Project: ------------------
    ipcRenderer.on("delete_project", (event, project_name) => {
      if (project_name === this.state.loadedProject.name) {
        //Set to Default.
        this.setState((prevState) => ({
          loadedProject: {
            ...prevState.loadedProject,
            files: [],
            activeFile: -1,
            filePaths: [],
            cellDetectChannel: 0,
            name: "Untitled Project",
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
            selectCellChannel={this.selectCellChannel}
            tabs={this.state.tabs}
            executeNucleusDetection={this.executeNucleusDetection}
            nucleusDetectInfo={this.state.nucleusDetectInfo}
            nucleusRuntime={this.state.nucleusRuntime}
            cytoRuntime={this.state.cytoplasmRuntime}
            executeCytoDetection={this.executeCytoDetection}
            cytoDetectInfo={this.state.cytoplasmDetectInfo}
            selectCompositeOp={this.selectCompositeOp}
            compositeOp={this.state.loadedProject.compositeOp}
          />
          <DisplayPage
            ref={this.displayPageRef}
            project={this.state.loadedProject}
            selectAnnotation={this.handleSelectedAnnotationChange}
            selectedAnnotation={this.state.selectedAnnotation}
            addAnnotation={this.addAnnotation}
            tabs={this.state.tabs}
            closeTab={this.closeTab}
            compositeOp={this.state.loadedProject.compositeOp}
            selectTab={this.selectTab}
          />
          <RightPane
            project={this.state.loadedProject}
            onChannelChange={this.handleChannelChange}
            renameChannel={this.renameChannel}
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
  height: 100%;
`;
