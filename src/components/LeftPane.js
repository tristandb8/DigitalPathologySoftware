import React from "react";
import { ReactComponent as ProjectButton } from "../resources/ProjectButton.svg";
import { ReactComponent as ImageButton } from "../resources/ImageButton.svg";
import { ReactComponent as AnnotationButton } from "../resources/AnnotationButton.svg";

const LeftPanes = {
  Project: "Project",
  Image: "Image",
  Annotation: "Annotation",
};

class ProjectPane extends React.Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Project pane.</p>
      </div>
    );
  }
}

class ImagePane extends React.Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Image pane.</p>
      </div>
    );
  }
}

class AnnotationPane extends React.Component {
  render() {
    return (
      <div style={{ flexGrow: "100", display: "inline-flex" }}>
        <p>Annotation pane.</p>
      </div>
    );
  }
}

export default class LeftPane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedPane: LeftPanes.Project,
    };

    this.paneRender = this.paneRender.bind(this);
  }

  paneRender() {
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
  }

  render() {
    return (
      <div
        style={{
          width: "400px",
          height: "100%",
          backgroundColor: "#F3F3F3",
          display: "flex",
        }}
      >
        <div
          style={{
            width: "44px",
            backgroundColor: "#1B1B1B",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <ProjectButton
            style={{
              fill:
                this.state.selectedPane === LeftPanes.Project
                  ? "#FFFFFF"
                  : "#808080",
              padding: "12px 0px 12px 0px",
            }}
            onClick={() => {
              this.setState({ selectedPane: LeftPanes.Project });
            }}
          />
          <ImageButton
            style={{
              fill:
                this.state.selectedPane === LeftPanes.Image
                  ? "#FFFFFF"
                  : "#808080",
              padding: "12px 0px 12px 0px",
            }}
            onClick={() => {
              this.setState({ selectedPane: LeftPanes.Image });
            }}
          />
          <AnnotationButton
            style={{
              fill:
                this.state.selectedPane === LeftPanes.Annotation
                  ? "#FFFFFF"
                  : "#808080",
              padding: "12px 0px 12px 0px",
            }}
            onClick={() => {
              this.setState({ selectedPane: LeftPanes.Annotation });
            }}
          />
        </div>
        <this.paneRender />
      </div>
    );
  }
}
