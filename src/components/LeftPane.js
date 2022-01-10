import React, { Component } from "react";
import { ReactComponent as ProjectButton } from "../resources/ProjectButton.svg";
import { ReactComponent as ImageButton } from "../resources/ImageButton.svg";
import { ReactComponent as AnnotationButton } from "../resources/AnnotationButton.svg";

const LeftPanes = {
  Project: "Project",
  Image: "Image",
  Annotation: "Annotation",
};

class ProjectPane extends Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Project pane.</p>
      </div>
    );
  }
}

class ImagePane extends Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Image pane.</p>
      </div>
    );
  }
}

class AnnotationPane extends Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Annotation pane.</p>
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

    return (
      <div className="paneSwitchButton">
        <div
          className="paneSwitchIndicator"
          style={{
            backgroundColor: this.props.selected ? "white" : "#00000000",
          }}
        />
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
        return <ProjectPane />;
      case LeftPanes.Image:
        return <ImagePane />;
      case LeftPanes.Annotation:
        return <AnnotationPane />;
      default:
        return <ProjectPane />;
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
