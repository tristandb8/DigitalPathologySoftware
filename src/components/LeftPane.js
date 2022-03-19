import React, { Component } from "react";
import { ReactComponent as ProjectButton } from "../resources/ProjectButton.svg";
import { ReactComponent as ImageButton } from "../resources/ImageButton.svg";
import { ReactComponent as AnnotationButton } from "../resources/AnnotationButton.svg";
// import { ReactComponent as EditButton } from "../resources/Edit.svg";
import { ReactComponent as TrashButton } from "../resources/Trash.svg";
import { ReactComponent as PolygonButton } from "../resources/Polygon.svg";
import { ReactComponent as CircleButton } from "../resources/Circle.svg";
import { ReactComponent as SquareButton } from "../resources/Square.svg";
import { AnnotationTypes } from "../utils/annotations";
const { ipcRenderer } = window.require("electron");

const LeftPanes = {
  Project: "Project",
  Image: "Image",
  Annotation: "Annotation",
};

class ProjectFile extends Component {
  handleDoubleClick = (e) => {
    if (this.props.tabIndex < 0)
      ipcRenderer.send("request-image-load", this.props.file.path);
    else this.props.selectTab(this.props.tabIndex);
  };

  render() {
    const className = this.props.selected
      ? "projectFileSelected"
      : "projectFile";
    return (
      <div className={className} onDoubleClick={this.handleDoubleClick}>
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
  getTabIndex = (file) => {
    for (let index = 0; index < this.props.project.openFiles.length; index++) {
      const openFile = this.props.project.openFiles[index];
      if (openFile.path === file.path) return index;
    }
    return -1;
  };

  render() {
    const selectedImage =
      this.props.project.openFiles[this.props.project.activeFile];

    return (
      <div className="projectPane">
        <h1 className="paneHeader">{this.props.project.name}</h1>
        {this.props.project.filePaths.map((file, index) => (
          <ProjectFile
            file={file}
            key={index}
            selectTab={this.props.selectTab}
            tabIndex={this.getTabIndex(file)}
            selected={file.path === selectedImage?.path}
          />
        ))}
      </div>
    );
  }
}

class ImagePane extends Component {
  render() {
    const selectedImage =
      this.props.project.openFiles[this.props.project.activeFile];
    return selectedImage ? (
      <div className="imagePane">
        <h1 className="imagePaneHeader">Name</h1>
        <p className="imagePaneLabel">{selectedImage.name}</p>
        <h1 className="imagePaneHeader">Width</h1>
        <p className="imagePaneLabel">{selectedImage.width}</p>
        <h1 className="imagePaneHeader">Height</h1>
        <p className="imagePaneLabel">{selectedImage.height}</p>
        <h1 className="imagePaneHeader">Channels</h1>
        <p className="imagePaneLabel">{selectedImage.channels}</p>
        <h1 className="imagePaneHeader">Cell Channel</h1>
        <select
          onChange={this.props.selectCellChannel}
          value={selectedImage.cellDetectChannel}
        >
          {selectedImage.idfArray.map((item, index) => {
            return (
              <option value={index} key={index}>
                {item.name}
              </option>
            );
          })}
        </select>
        <button onClick={this.props.executeNucleusDetection}>
          Execute Nucleus Detection
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
            stroke={this.props.annotation.color}
          />
        );
      case AnnotationTypes.Square:
        return (
          <SquareButton
            className="annotationIcon"
            stroke={this.props.annotation.color}
          />
        );
      case AnnotationTypes.Polygon:
        return (
          <PolygonButton
            className="annotationIcon"
            stroke={this.props.annotation.color}
          />
        );
      default:
        return (
          <SquareButton
            className="annotationIcon"
            stroke={this.props.annotation.color}
          />
        );
    }
  };

  render() {
    const className = this.props.selected
      ? "annotationItemSelected"
      : "annotationItem";
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
            onChange={(e) => {
              this.props.onAnnotationChange(
                this.props.index,
                "name",
                e.target.value
              );
            }}
            value={this.props.annotation.name}
          />
          <TrashButton
            className="annotationButton"
            onClick={(e) => {
              e.stopPropagation();
              this.props.removeAnnotation(this.props.index);
            }}
          />
        </div>
        <hr className="channelHR" />
      </div>
    );
  }
}

class AnnotationPane extends Component {
  selectAnnotation = (index) => {
    this.props.selectAnnotation(index);
  };

  render() {
    const selectedImage =
      this.props.project.openFiles[this.props.project.activeFile];
    return selectedImage ? (
      <div className="annotationPane">
        {selectedImage.annotations.map((annotation, index) => (
          <AnnotationItem
            key={index}
            index={index}
            annotation={annotation}
            // name={annotation.name}
            // type={annotation.type}
            // color={annotation.color}
            onAnnotationChange={this.props.onAnnotationChange}
            removeAnnotation={this.props.removeAnnotation}
            selectAnnotation={this.selectAnnotation}
            selected={this.props.selectedAnnotation === index}
          />
        ))}
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
    switch (this.state.selectedPane) {
      case LeftPanes.Project:
        return (
          <ProjectPane
            project={this.props.project}
            selectTab={this.props.selectTab}
          />
        );
      case LeftPanes.Image:
        return (
          <ImagePane
            project={this.props.project}
            executeNucleusDetection={this.props.executeNucleusDetection}
            selectCellChannel={this.props.selectCellChannel}
          />
        );
      case LeftPanes.Annotation:
        return (
          <AnnotationPane
            project={this.props.project}
            onAnnotationChange={this.props.onAnnotationChange}
            selectAnnotation={this.props.selectAnnotation}
            removeAnnotation={this.props.removeAnnotation}
            selectedAnnotation={this.props.selectedAnnotation}
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
