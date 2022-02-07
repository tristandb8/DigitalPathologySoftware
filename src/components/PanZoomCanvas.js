import React, { Component } from "react";
import { getBitmap } from "../utils/tiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import grid from "../resources/GridFull.svg";
import { ReactComponent as LogoImage } from "../resources/Logo.svg";
import * as Point from "../utils/pointUtils";
import * as Annotations from "../utils/annotations";

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
      dragging: false,
      mouseStart: Point.ORIGIN,
      mousePos: Point.ORIGIN,
    };
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.scale !== this.props.scale ||
      oldProps.mode !== this.props.mode ||
      this.props.annotations !== oldProps.annotations
    ) {
      this.updateCanvas();
    }
  }

  handleMouseEvent = (event) => {
    if (event.type === "mouseup") {
      if (this.state.dragging) {
        const boundingRect = this.canvasRef.current.getBoundingClientRect();
        const start = Point.Point(
          this.state.mouseStart.x - boundingRect.x,
          this.state.mouseStart.y - boundingRect.y
        );
        const end = Point.Point(
          this.state.mousePos.x - boundingRect.x,
          this.state.mousePos.y - boundingRect.y
        );
        switch (this.props.mode) {
          case Modes.Zoom:
            this.props.onZoom(
              start.x / this.props.scale,
              start.y / this.props.scale,
              (end.x - start.x) / this.props.scale,
              (end.y - start.y) / this.props.scale
            );
            break;
          case Modes.AnnotateCircle:
            const r = Math.abs(Point.dist(start, end));
            this.props.addAnnotation(
              Annotations.Circle(
                start.x / this.props.scale,
                start.y / this.props.scale,
                r / this.props.scale,
                "red"
              )
            );
            break;
          case Modes.AnnotateSquare:
            this.props.addAnnotation(
              Annotations.Square(
                start.x / this.props.scale,
                start.y / this.props.scale,
                (end.x - start.x) / this.props.scale,
                (end.y - start.y) / this.props.scale,
                "red"
              )
            );
            break;
          default:
            break;
        }
      }
      this.setState({
        dragging: false,
      });
    } else if (event.type === "mousedown") {
      this.setState({
        dragging: true,
        mouseStart: Point.Point(event.pageX, event.pageY),
        mousePos: Point.Point(event.pageX, event.pageY),
      });
    } else if (event.type === "mouseleave") {
      this.setState({
        dragging: false,
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
    canvas.width = boundingRect.width;
    canvas.height = boundingRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state.dragging) {
      const start = Point.Point(
        this.state.mouseStart.x - boundingRect.x,
        this.state.mouseStart.y - boundingRect.y
      );
      const end = Point.Point(
        this.state.mousePos.x - boundingRect.x,
        this.state.mousePos.y - boundingRect.y
      );
      const norm = Point.normalize(Point.norm(start, end));
      // TODO: Scale norm based on whether text goes OOB
      const normScaled = Point.scale(norm, Point.angle(norm) >= 0 ? -10 : 10);
      const startEndAvg = Point.sum(
        start,
        Point.scale(Point.diff(start, end), 0.5)
      );
      const normLine = Point.sum(startEndAvg, normScaled);

      switch (this.props.mode) {
        case Modes.Measure:
          const lineLength = parseInt(
            Point.dist(start, end) / this.props.scale
          );
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.fillStyle = "white";
          ctx.strokeStyle = "white";
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.font = "22px serif";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.strokeText(`${lineLength} px`, normLine.x, normLine.y);
          ctx.fillText(`${lineLength} px`, normLine.x, normLine.y);
          ctx.closePath();
          break;
        case Modes.AnnotateCircle:
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#ff000010";
          ctx.strokeStyle = "red";
          const r = Point.dist(start, end);
          ctx.arc(start.x, start.y, r, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.stroke();
          ctx.closePath();
          break;
        case Modes.AnnotateSquare:
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#ff000010";
          ctx.strokeStyle = "red";
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
          ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
          ctx.stroke();
          ctx.closePath();
          break;
        case Modes.Zoom:
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "white";
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
          ctx.stroke();
          ctx.closePath();
          break;
        default:
          break;
      }
    }

    for (const annotation of this.props.annotations) {
      switch (annotation.type) {
        case Annotations.AnnotationTypes.Circle:
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#ff000010";
          ctx.strokeStyle = annotation.color;
          ctx.arc(
            annotation.params.x * this.props.scale,
            annotation.params.y * this.props.scale,
            annotation.params.r * this.props.scale,
            0,
            2 * Math.PI,
            false
          );
          ctx.fill();
          ctx.stroke();
          ctx.closePath();
          break;
        case Annotations.AnnotationTypes.Square:
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#ff000010";
          ctx.strokeStyle = "red";
          ctx.strokeRect(
            annotation.params.x * this.props.scale,
            annotation.params.y * this.props.scale,
            annotation.params.w * this.props.scale,
            annotation.params.h * this.props.scale
          );
          ctx.fillRect(
            annotation.params.x * this.props.scale,
            annotation.params.y * this.props.scale,
            annotation.params.w * this.props.scale,
            annotation.params.h * this.props.scale
          );
          ctx.stroke();
          ctx.closePath();
          break;
        default:
          break;
      }
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

    this.state = {
      scale: 1,
    };
  }

  resetView = () => {
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

    this.setState({ scale: Math.min(scaleX, scaleY) * 0.99 });
  };

  zoomToCoords = (x, y, w, h) => {
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }
    const boundingRect = this.portRef.current.getBoundingClientRect();
    const scaleX = w / boundingRect.width;
    const scaleY = h / boundingRect.height;
    const s = Math.max(Math.min(1 / Math.max(scaleX, scaleY), 8), 1);
    this.viewRef.current.centerView(s, 0, "easeOut");
    this.viewRef.current.setTransform(-x * s, -y * s, s, 0, "easeOut");
    this.setState({ scale: s });
  };

  updateCanvas() {
    const canvas = this.canvasRef.current;
    if (canvas == null) return;
    const ctx = canvas.getContext("2d");
    const loadedFile = this.props.file;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.file.type === "tiff") {
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

    // Not sure if this should go here or componentDidUpdate...
    // Keeping it here for now unless I think of a better reason other than
    // performance (which may or may not be enough?)
    this.annotationCanvasRef.current?.updateCanvas();
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
    if (this.props.file == null) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoImage
            style={{ fill: "#2f2f2f", width: "400px", height: "400px" }}
          />
        </div>
      );
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
              <div
                ref={this.gridRef}
                className="backgroundGrid"
                style={{
                  pointerEvents: "none",
                  backgroundImage: this.props.grid ? `url(${grid})` : "none",
                }}
              />
              <AnnotatedCanvas
                ref={this.annotationCanvasRef}
                mode={this.props.mode}
                scale={this.state.scale}
                onZoom={this.zoomToCoords}
                addAnnotation={this.props.addAnnotation}
                annotations={this.props.file.annotations}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      );
    }
  }
}
