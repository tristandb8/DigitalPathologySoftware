import React, { Component } from "react";
import { getBitmap } from "../utils/TiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import grid from "../resources/GridFull.svg";
import * as Point from "../utils/pointUtils";

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
      mouseStart: Point.ORIGIN,
      mousePos: Point.ORIGIN,
    };
  }

  componentDidUpdate(oldProps) {
    if (oldProps.scale !== this.props.scale) {
      console.log(this.props.scale);
      this.updateCanvas();
    }
  }

  handleMouseEvent = (event) => {
    if (event.type === "mouseup") {
      if (this.props.mode === Modes.Measure) {
        this.setState({
          measuring: false,
          mouseStart: Point.ORIGIN,
          mousePos: Point.ORIGIN,
        });
      }
    } else if (event.type === "mousedown") {
      if (this.props.mode === Modes.Measure) {
        this.setState({
          measuring: true,
          mouseStart: Point.Point(event.pageX, event.pageY),
          mousePos: Point.Point(event.pageX, event.pageY),
        });
      }
    } else if (event.type === "mouseleave") {
      this.setState({
        measuring: false,
      });
    } else {
      this.setState({
        mousePos: Point.Point(event.pageX, event.pageY),
      });
    }
    this.updateCanvas();
  };

  updateCanvas = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    const boundingRect = this.canvasRef.current.getBoundingClientRect();
    const start = Point.Point(
      this.state.mouseStart.x - boundingRect.x,
      this.state.mouseStart.y - boundingRect.y
    );
    const end = Point.Point(
      this.state.mousePos.x - boundingRect.x,
      this.state.mousePos.y - boundingRect.y
    );

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
      const norm = Point.normalize(Point.norm(start, end));
      // TODO: Scale norm based on whether text goes OOB
      const normScaled = Point.scale(norm, Point.angle(norm) >= 0 ? -10 : 10);
      const lineLength = parseInt(Point.dist(start, end) / this.props.scale);
      const startEndAvg = Point.sum(
        start,
        Point.scale(Point.diff(start, end), 0.5)
      );
      const normLine = Point.sum(startEndAvg, normScaled);
      ctx.stroke();
      ctx.font = "14 px";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText(`${lineLength} px`, normLine.x, normLine.y);
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
      scale: 1,
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

    this.setState({ scale: Math.min(scaleX, scaleY) });
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
      console.log(loadedFile.width, loadedFile.height);

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
              this.setState({
                scale: ref.state.scale,
              });
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
                scale={this.state.scale}
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
