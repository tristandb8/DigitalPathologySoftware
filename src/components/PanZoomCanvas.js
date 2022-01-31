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

class AnnotatedCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);

    this.state = {
      measuring: false,
      mouseStart: { x: 0, y: 0 },
      mousePos: { x: 0, y: 0 },
    };
  }

  handleMouseEvent = (event) => {
    if (event.type === "mouseup") {
      if (this.props.mode === Modes.Measure) {
        this.setState({
          measuring: false,
          mouseStart: { x: 0, y: 0 },
          mousePos: { x: 0, y: 0 },
        });
      }
    } else if (event.type === "mousedown") {
      if (this.props.mode === Modes.Measure) {
        this.setState({
          measuring: true,
          mouseStart: { x: event.pageX, y: event.pageY },
          mousePos: { x: event.pageX, y: event.pageY },
        });
      }
    } else if (event.type === "mouseleave") {
      this.setState({
        measuring: false,
      });
    } else {
      this.setState({
        mousePos: { x: event.pageX, y: event.pageY },
      });
    }
    this.updateCanvas();
  };

  updateCanvas = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    const boundingRect = this.canvasRef.current.getBoundingClientRect();
    const start = {
      x: this.state.mouseStart.x - boundingRect.x,
      y: this.state.mouseStart.y - boundingRect.y,
    };
    const end = {
      x: this.state.mousePos.x - boundingRect.x,
      y: this.state.mousePos.y - boundingRect.y,
    };

    canvas.width = boundingRect.width;
    canvas.height = boundingRect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    if (this.state.measuring) {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else {
      // ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      // ctx.fill();
    }
  };

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        onMouseDown={this.handleMouseEvent}
        onMouseMove={this.handleMouseEvent}
        onMouseUp={this.handleMouseEvent}
        onMouseLeave={this.handleMouseEvent}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      />
    );
  }
}

export default class PanZoomCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);
    this.annotationCanvasRef = React.createRef(null);
    this.viewRef = React.createRef(null);
    this.gridRef = React.createRef(null);
    this.portRef = React.createRef(null);
    this.resetView = this.resetView.bind(this);

    this.state = {
      measuring: false,
      mousePos: { x: 0, y: 0 },
      mouseStart: { x: 0, y: 0 },
    };
  }

  resetView() {
    const scaleX =
      this.portRef.current.offsetWidth / this.canvasRef.current.offsetWidth;
    const scaleY =
      this.portRef.current.offsetHeight / this.canvasRef.current.offsetHeight;

    this.viewRef.current.resetTransform(0, "easeOut");
    this.viewRef.current.centerView(
      Math.min(scaleX, scaleY) * 0.99,
      0,
      "easeOut"
    );
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
        <div style={{ width: "100%", height: "100%" }} ref={this.portRef}>
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
              <AnnotatedCanvas
                ref={this.annotationCanvasRef}
                mode={this.props.mode}
              />
              <div
                ref={this.gridRef}
                className="backgroundGrid"
                style={{
                  pointerEvents: "none",
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
