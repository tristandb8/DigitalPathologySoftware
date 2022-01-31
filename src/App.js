import React, { Component } from "react";
import { tiffImage } from "./utils/TiffModel";
import styled from "styled-components";
import DisplayPage from "./components/DisplayPage";
import RightPane from "./components/RightPane";
import LeftPane from "./components/LeftPane";
import "./App.css";

const { ipcRenderer } = window.require("electron");

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadedFileType: null,
      loadedFile: null,
    };

    this.handleChannelToggle = this.handleChannelToggle.bind(this);
    this.handleChannelThresh = this.handleChannelThresh.bind(this);
    this.handleChannelColor = this.handleChannelColor.bind(this);
    this.handleChannelName = this.handleChannelName.bind(this);
    this.displayPageRef = React.createRef(null);
  }

  handleChannelChange = (index, key, value) => {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item[key] = value;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  };

  handleChannelToggle(index) {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item.enabled = !item.enabled;
    items[index] = item;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  }

  handleChannelThresh(index, range) {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item.threshold = range;
    items[index] = item;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  }

  handleChannelColor(index, color) {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item.channelColor = color;
    items[index] = item;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  }

  handleChannelName(index, name) {
    let items = [...this.state.loadedFile.idfArray];
    let item = { ...items[index] };
    item.name = name;
    items[index] = item;

    this.setState((prevState) => ({
      loadedFile: { ...prevState.loadedFile, idfArray: items },
    }));
  }

  componentDidMount() {
    ipcRenderer.on("new-image", (event, fileContent) => {
      let file;

      if (fileContent.type === "tiff") {
        file = tiffImage(fileContent.data);
      } else if (fileContent.type === "image") {
        file = fileContent.data;
      }

      this.setState({
        loadedFileType: fileContent.type,
        loadedFile: file,
      });

      if (
        this.displayPageRef.current != null &&
        this.displayPageRef.current.canvasRef.current != null
      )
        this.displayPageRef.current.canvasRef.current.resetView();
    });

    ipcRenderer.send("load-previous-image");
  }

  render() {
    return (
      <div className="App">
        <Split>
          <LeftPane />
          <DisplayPage ref={this.displayPageRef} file={this.state} />
          <RightPane
            file={this.state.loadedFile}
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
