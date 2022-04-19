import React, { Component } from "react";
import { ReactComponent as ProjectButton } from "../resources/ProjectButton.svg";
import { ReactComponent as ImageButton } from "../resources/ImageButton.svg";
import { ReactComponent as AnnotationButton } from "../resources/AnnotationButton.svg";
// import { ReactComponent as EditButton } from "../resources/Edit.svg";
import { ReactComponent as TrashButton } from "../resources/Trash.svg";
import { ReactComponent as PolygonButton } from "../resources/Polygon.svg";
import { ReactComponent as CircleButton } from "../resources/Circle.svg";
import { ReactComponent as SquareButton } from "../resources/Square.svg";
import { AnnotationTypes, defaultColor } from "../utils/annotations";
import { SketchPicker } from "react-color";
const { ipcRenderer } = window.require("electron");

const LeftPanes = {
  Project: "Project",
  Image: "Image",
  Annotation: "Annotation",
};

class ProjectFile extends Component {
  handleClick = (e) => {
    if (!this.props.tabs.get(this.props.file.path)) {
      ipcRenderer.send("request-image-load", this.props.file.path);
    } else this.props.selectTab(this.props.file.path);
  };

  render() {
    const className = this.props.selected
      ? "projectFileSelected"
      : "projectFile";
    return (
      <div className={className} onClick={this.handleClick}>
        <div className="imageThumb">
          <p className="imageText" style={{ margin: "0", fontSize: "20px" }}>
            T
          </p>
        </div>
        <p className="imageText">{this.props.file.name}</p>
      </div>
    );
  }
}

class ProjectPane extends Component {
  render() {
    const selectedImage = this.props.project.activeFile;

    return (
      <div className="projectPane">
        {[...this.props.project.files.keys()].map((key, index) => (
          <ProjectFile
            file={this.props.project.files.get(key)}
            key={key}
            tabs={this.props.tabs}
            selectTab={this.props.selectTab}
            selected={key === selectedImage}
          />
        ))}
      </div>
    );
  }
}

class ImagePane extends Component {
  msToTime = (duration) => {
    // https://stackoverflow.com/questions/19700283/how-to-convert-time-in-milliseconds-to-hours-min-sec-format-in-javascript
    let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
  };

  render() {
    const selectedImage = this.props.project.files.get(
      this.props.project.activeFile
    );

    return selectedImage ? (
      <div className="imagePane">
        <h1 className="imagePaneHeader">Name</h1>
        <p className="imagePaneLabel">{selectedImage.name}</p>
        <h1 className="imagePaneHeader">Width</h1>
        <p className="imagePaneLabel">{selectedImage.imageData.width}</p>
        <h1 className="imagePaneHeader">Height</h1>
        <p className="imagePaneLabel">{selectedImage.imageData.height}</p>
        <h1 className="imagePaneHeader">Channels</h1>
        <p className="imagePaneLabel">{selectedImage.imageData.channels}</p>
        <h1 className="imagePaneHeader">Channels</h1>
        <p className="imagePaneLabel">{selectedImage.imageData.channels}</p>
        <h1 className="imagePaneHeader">Composite Operation</h1>
        <select
          className="imagePaneLabel"
          onChange={this.props.selectCompositeOp}
          value={this.props.compositeOp}
        >
          {[
            "color",
            "color-burn",
            "color-dodge",
            "darken",
            "difference",
            "exclusion",
            "hard-light",
            "hue",
            "lighten",
            "lighter",
            "luminosity",
            "multiply",
            "overlay",
            "saturation",
            "screen",
            "soft-light",
            "xor",
          ].map((item, index) => {
            return (
              <option value={item} key={index}>
                {item}
              </option>
            );
          })}
        </select>

        <h1 className="imagePaneHeader">Cell Channel</h1>
        <select
          className="imagePaneLabel"
          onChange={this.props.selectCellChannel}
          value={selectedImage.cellDetectChannel}
        >
          {selectedImage.channelNames.map((item, index) => {
            return (
              <option value={index} key={index}>
                {item}
              </option>
            );
          })}
        </select>
        <button
          className="imagePaneLabel"
          onClick={this.props.executeNucleusDetection}
          disabled={
            this.props.nucleusDetectInfo != null ||
            this.props.cytoDetectInfo != null
          }
        >
          {this.props.nucleusDetectInfo != null
            ? `${this.msToTime(this.props.nucleusRuntime)}`
            : "Nucleus Detection"}
        </button>
        <button
          className="imagePaneLabel"
          onClick={this.props.executeCytoDetection}
          disabled={
            this.props.nucleusDetectInfo != null ||
            this.props.cytoDetectInfo != null ||
            this.props.loadedFile.nucleusDetection === null
          }
        >
          {this.props.cytoDetectInfo != null
            ? `${this.msToTime(this.props.cytoRuntime)}`
            : "Cytoplasm Detection"}
        </button>
      </div>
    ) : (
      <div className="imagePane" />
    );
  }
}

class AnnotationItem extends Component {
  getAnnotationIcon = () => {
    switch (this.props.annotation.type) {
      case AnnotationTypes.Circle:
        return (
          <CircleButton
            className="annotationIcon"
            stroke={this.props.annotation.color.hex}
          />
        );
      case AnnotationTypes.Square:
        return (
          <SquareButton
            className="annotationIcon"
            stroke={this.props.annotation.color.hex}
          />
        );
      case AnnotationTypes.Polygon:
        return (
          <PolygonButton
            className="annotationIcon"
            stroke={this.props.annotation.color.hex}
          />
        );
      default:
        return (
          <SquareButton
            className="annotationIcon"
            stroke={this.props.annotation.color.hex}
          />
        );
    }
  };

  render() {
    const className = this.props.selected
      ? "annotationItemSelected"
      : "annotationItem";
    const button =
      this.props.index === 0 ? (
        <div className="annotationButtonStatic" />
      ) : (
        <TrashButton
          className="annotationButton"
          onClick={(e) => {
            e.stopPropagation();
            this.props.removeAnnotation(this.props.index);
          }}
        />
      );
    return (
      <div
        onClick={(e) => {
          this.props.selectAnnotation(this.props.index);
        }}
      >
        <div className={className}>
          {this.getAnnotationIcon()}
          <input
            key="name"
            type="text"
            className="channelTextInput"
            disabled={this.props.index === 0}
            onChange={(e) => {
              this.props.onAnnotationChange(
                this.props.index,
                "name",
                e.target.value
              );
            }}
            value={this.props.annotation.name}
          />
          {button}
        </div>
        <hr className="channelHR" />
      </div>
    );
  }
}

class AnnotationInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: defaultColor(),
    };
  }

  componentDidUpdate(oldProps) {
    if (oldProps.selectedAnnotation !== this.props.selectedAnnotation) {
      this.setState({
        color: this.props.selectedAnnotation?.color || defaultColor(),
      });
    }
  }

  handleChange = (color, event) => {
    this.props.onAnnotationChange(
      this.props.selectedAnnotationIndex,
      "color",
      color
    );
    this.setState({
      color: color,
    });
  };

  render() {
    if (this.props.selectedAnnotation != null) {
      return (
        <div className="imagePane">
          <div>
            <h1 className="imagePaneHeader">Nucleus Detect Fill</h1>
            <input
              type="checkbox"
              checked={this.props.selectedAnnotation.useNucleusDetection}
              disabled={!this.props.canUseNucleusBackground}
              onChange={() =>
                this.props.onAnnotationChange(
                  this.props.index,
                  "useNucleusDetection",
                  !this.props.selectedAnnotation.useNucleusDetection
                )
              }
              style={{ width: "16px", height: "16px" }}
            />
          </div>
          <h1 className="imagePaneHeader">Color</h1>
          <SketchPicker
            color={this.state.color.rgb}
            onChange={this.handleChange}
          />
        </div>
      );
    } else {
      return <div />;
    }
  }
}

class AnnotationPane extends Component {
  selectAnnotation = (index) => {
    this.props.selectAnnotation(index);
  };

  render() {
    const selectedImage = this.props.project.files.get(
      this.props.project.activeFile
    );
    return selectedImage ? (
      <div className="annotationPane">
        <div className="annotationList">
          {selectedImage.annotations.map((annotation, index) => (
            <AnnotationItem
              key={index}
              index={index}
              annotation={annotation}
              onAnnotationChange={this.props.onAnnotationChange}
              removeAnnotation={this.props.removeAnnotation}
              selectAnnotation={this.selectAnnotation}
              selected={this.props.selectedAnnotation === index}
            />
          ))}
        </div>
        <hr className="channelHR" style={{ marginTop: "4px" }} />
        <AnnotationInput
          onAnnotationChange={this.props.onAnnotationChange}
          selectedAnnotationIndex={this.props.selectedAnnotation}
          index={this.props.selectedAnnotation}
          canUseNucleusBackground={this.props.canUseNucleusBackground}
          selectedAnnotation={
            selectedImage.annotations[this.props.selectedAnnotation]
          }
        />
      </div>
    ) : (
      <div className="annotationPane" />
    );
  }
}

class PaneSwitchButton extends Component {
  chooseButton = () => {
    const style = { fill: this.props.selected ? "white" : "#808080" };

    switch (this.props.buttonType) {
      case LeftPanes.Project:
        return <ProjectButton style={style} />;
      case LeftPanes.Image:
        return <ImageButton style={style} />;
      case LeftPanes.Annotation:
        return <AnnotationButton style={style} />;
      default:
        return <div />;
    }
  };

  render() {
    const onClick = () => {
      this.props.switchPane(this.props.buttonType);
    };

    const paneSwitchIndicatorStyle = this.props.selected
      ? "paneSwitchIndicatorSelected"
      : "paneSwitchIndicator";

    return (
      <div className="paneSwitchButton">
        <div className={paneSwitchIndicatorStyle} />
        <div className="paneSwitchIcon" onClick={onClick}>
          {this.chooseButton()}
        </div>
      </div>
    );
  }
}

export default class LeftPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPane: LeftPanes.Project,
    };
  }

  paneRender = () => {
    const loadedFile = this.props.project.files.get(
      this.props.project.activeFile
    );
    switch (this.state.selectedPane) {
      case LeftPanes.Project:
        return (
          <ProjectPane
            tabs={this.props.tabs}
            project={this.props.project}
            selectTab={this.props.selectTab}
          />
        );
      case LeftPanes.Image:
        return (
          <ImagePane
            project={this.props.project}
            loadedFile={loadedFile}
            nucleusDetectInfo={this.props.nucleusDetectInfo}
            executeNucleusDetection={this.props.executeNucleusDetection}
            nucleusRuntime={this.props.nucleusRuntime}
            cytoDetectInfo={this.props.cytoDetectInfo}
            executeCytoDetection={this.props.executeCytoDetection}
            cytoRuntime={this.props.cytoRuntime}
            selectCellChannel={this.props.selectCellChannel}
            selectCompositeOp={this.props.selectCompositeOp}
            compositeOp={this.props.compositeOp}
          />
        );
      case LeftPanes.Annotation:
        const canUseNucleusBackground = loadedFile.nucleusDetection != null;
        return (
          <AnnotationPane
            project={this.props.project}
            onAnnotationChange={this.props.onAnnotationChange}
            selectAnnotation={this.props.selectAnnotation}
            removeAnnotation={this.props.removeAnnotation}
            selectedAnnotation={this.props.selectedAnnotation}
            canUseNucleusBackground={canUseNucleusBackground}
          />
        );
      default:
        return <ProjectPane project={this.props.project} />;
    }
  };

  switchPane = (pane) => {
    this.setState({ selectedPane: pane });
  };

  render() {
    return (
      <div className="leftPane">
        <div className="leftPaneSwitcher">
          <PaneSwitchButton
            buttonType={LeftPanes.Project}
            selected={this.state.selectedPane === LeftPanes.Project}
            switchPane={this.switchPane}
          />
          <PaneSwitchButton
            buttonType={LeftPanes.Image}
            selected={this.state.selectedPane === LeftPanes.Image}
            switchPane={this.switchPane}
          />
          <PaneSwitchButton
            buttonType={LeftPanes.Annotation}
            selected={this.state.selectedPane === LeftPanes.Annotation}
            switchPane={this.switchPane}
          />
        </div>
        <this.paneRender />
      </div>
    );
  }
}
