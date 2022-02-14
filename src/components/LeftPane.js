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

const LeftPanes = {
  Project: "Project",
  Image: "Image",
  Annotation: "Annotation",
};

class ProjectFile extends Component {
  render() {
    const className = this.props.selected
      ? "projectFileSelected"
      : "projectFile";
    return (
      <div className={className}>
        <div className="imageThumb">
          <p className="imageText" style={{ margin: "0", fontSize: "20px" }}>
            T
          </p>
        </div>
        <p className="imageText">{this.props.name}</p>
      </div>
    );
  }
}

class ProjectPane extends Component {
  render() {
    return (
      <div className="projectPane">
        <h1 className="paneHeader">{this.props.project.name}</h1>
        <ProjectFile selected={false} name="Image1.tiff" />
        <ProjectFile selected={true} name="Image2.tiff" />
        <ProjectFile selected={false} name="Image3.tiff" />
      </div>
    );
  }
}

class ImagePane extends Component {
  render() {
    const selectedImage =
      this.props.project.openFiles[this.props.project.activeFile];
    return (
      <div className="imagePane">
        <h1 className="imagePaneHeader">Name</h1>
        <p className="imagePaneLabel">{selectedImage.name}</p>
        <h1 className="imagePaneHeader">Width</h1>
        <p className="imagePaneLabel">{selectedImage.width}</p>
        <h1 className="imagePaneHeader">Height</h1>
        <p className="imagePaneLabel">{selectedImage.height}</p>
        <h1 className="imagePaneHeader">Channels</h1>
        <p className="imagePaneLabel">{selectedImage.channels}</p>
      </div>
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
    const className = this.props.annotation.selected
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
            defaultValue={this.props.annotation.name}
          />
          <div>
            {/* <EditButton className="annotationButton" /> */}
            <TrashButton
              className="annotationButton"
              onClick={(e) => {
                e.stopPropagation();
                this.props.removeAnnotation(this.props.index);
              }}
            />
          </div>
        </div>
        <hr className="channelHR" />
      </div>
    );
  }
}

class AnnotationPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAnnotation: -1,
    };
  }

  selectAnnotation = (index) => {
    if (this.state.selectedAnnotation >= 0)
      this.props.onAnnotationChange(
        this.state.selectedAnnotation,
        "selected",
        false
      );
    this.setState({
      selectedAnnotation: index,
    });
    this.props.onAnnotationChange(index, "selected", true);
  };

  render() {
    const selectedImage =
      this.props.project.openFiles[this.props.project.activeFile];
    return (
      <div className="annotationPane">
        {selectedImage.annotations.map((annotation, index) => (
          <AnnotationItem
            key={index}
            index={index}
            annotation={annotation}
            onAnnotationChange={this.props.onAnnotationChange}
            removeAnnotation={this.props.removeAnnotation}
            selectAnnotation={this.selectAnnotation}
          />
        ))}
      </div>
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
        return <ProjectPane project={this.props.project} />;
      case LeftPanes.Image:
        return <ImagePane project={this.props.project} />;
      case LeftPanes.Annotation:
        return (
          <AnnotationPane
            project={this.props.project}
            onAnnotationChange={this.props.onAnnotationChange}
            removeAnnotation={this.props.removeAnnotation}
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
