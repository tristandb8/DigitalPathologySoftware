import React, { Component } from "react";
import { getBitmap } from "../utils/TiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import grid from "../resources/GridFull.svg";

const Modes = {
  Pan: "Pan",
  Zoom: "Zoom",
  Measure: "Measure",
  AnnotateCircle: "AnnotateCircle",
  AnnotateSquare: "AnnotateSquare",
};

export default class PanZoomCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);
    this.viewRef = React.createRef(null);
    this.gridRef = React.createRef(null);
    this.resetView = this.resetView.bind(this);

    this.state = {
      measuring: false,
    };
  }

  resetView() {
    this.viewRef.current.resetTransform(0, "easeOut");
    this.viewRef.current.centerView(undefined, 0, "easeOut");
  }

  updateCanvas() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    const loadedFile = this.props.file.loadedFile;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.file.loadedFileType === "tiff") {
      // Update canvas size
      canvas.width = loadedFile.width;
      canvas.height = loadedFile.height;

      // Ideally this would be changeable via dropdown
      // ctx.globalCompositeOperation = 'color'
      ctx.globalCompositeOperation = "source-over";

      // Draw each channel overlapping
      getBitmap(loadedFile).then(function (layers) {
        for (let i = 0; i < layers.length; i++) {
          ctx.drawImage(layers[i], 0, 0);
        }
      });
    } else {
      // TODO: FIX PNG RENDERING
      const img = new Image();
      img.src = loadedFile;
      canvas.width = 300;
      canvas.height = 150;
      ctx.drawImage(img, 0, 0);
    }

    // this.resetView()
  }

  componentDidUpdate(oldProps) {
    if (oldProps.file !== this.props.file) {
      this.updateCanvas();
    } else if (oldProps.grid !== this.props.grid) {
      this.gridRef.current.backgroundImage = this.props.grid
        ? `url(${grid})`
        : "none";
    }
  }

  render() {
    if (this.props.file.loadedFile == null) {
      return <div />;
    } else {
      return (
        <div style={{ width: "100%", height: "100%" }}>
          <TransformWrapper
            ref={this.viewRef}
            initialScale={1}
            limitToBounds={false}
            onZoom={(ref) => {
              this.props.onZoom(ref);
            }}
            panning={{
              disabled: this.props.mode !== Modes.Pan,
            }}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <canvas ref={this.canvasRef} className="displayCanvas" />
              <div
                ref={this.gridRef}
                className="backgroundGrid"
                style={{
                  backgroundImage: this.props.grid ? `url(${grid})` : "none",
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      );
    }
  }
}
