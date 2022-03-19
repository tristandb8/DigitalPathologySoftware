import React, { Component } from "react";
import { getBitmap } from "../utils/tiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ReactComponent as LogoImage } from "../resources/Logo.svg";
import { Modes } from "../utils/canvasModes";
import grid from "../resources/GridFull.svg";
import * as Point from "../utils/pointUtils";
import * as Annotations from "../utils/annotations";

class AnnotatedCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);

    this.state = {
      dragging: false,
      mouseStart: Point.ORIGIN,
      mousePos: Point.ORIGIN,
      annotationPos: Point.ORIGIN,
      canClosePoly: false,
      clickPoints: [],
      hoveredAnnotation: -1,
    };
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.scale !== this.props.scale ||
      oldProps.selectedAnnotation !== this.props.selectedAnnotation ||
      oldProps.mode !== this.props.mode ||
      oldProps.annotations !== this.props.annotations
    ) {
      this.updateCanvas();
      this.setState({ clickPoints: [] });
    }
  }

  checkAnnotationHit = (hit) => {
    for (let anni = 0; anni < this.props.annotations.length; anni++) {
      const annotation = this.props.annotations[anni];
      switch (annotation.type) {
        case Annotations.AnnotationTypes.Circle:
          const center = Point.Point(annotation.params.x, annotation.params.y);
          if (Point.dist(hit, center) < annotation.params.r) return anni;
          else break;
        case Annotations.AnnotationTypes.Square:
          const start = Point.Point(annotation.params.x, annotation.params.y);
          const end = Point.sum(
            start,
            Point.Point(annotation.params.w, annotation.params.h)
          );
          if (
            hit.x >= start.x &&
            hit.x <= end.x &&
            hit.y >= start.y &&
            hit.y <= end.y
          )
            return anni;
          else break;
        case Annotations.AnnotationTypes.Polygon:
          // Polygon Hit Detection: https://stackoverflow.com/a/2922778
          let isHit = false;
          for (
            let i = 0, j = annotation.params.length - 1;
            i < annotation.params.length;
            j = i++
          ) {
            const vi = annotation.params[i];
            const vj = annotation.params[j];
            const t1 = vi.y > hit.y;
            const t2 = vj.y > hit.y;
            if (
              t1 !== t2 &&
              hit.x < ((vj.x - vi.x) * (hit.y - vi.y)) / (vj.y - vi.y) + vi.x
            )
              isHit = !isHit;
          }
          if (isHit) return anni;
          else break;
        default:
          console.error("Unknown annotation type");
          break;
      }
    }

    return -1;
  };

  handleMouseEvent = (event) => {
    const boundingRect = this.canvasRef.current.getBoundingClientRect();
    if (event.type === "mouseup" && event.button === 0) {
      // Finish annotations currently being drawn
      if (this.state.dragging) {
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
            if (start.x > end.x) [start.x, end.x] = [end.x, start.x];
            if (start.y > end.y) [start.y, end.y] = [end.y, start.y];
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
    } else if (event.type === "mousedown" && event.button === 0) {
      let clickPoints = [...this.state.clickPoints];
      const clickPoint = Point.Point(
        event.pageX - boundingRect.x,
        event.pageY - boundingRect.y
      );

      // If annotating a polygon add the hit to the array of hits
      if (this.props.mode === Modes.AnnotatePolygon) {
        // If the mouse was close enough to the original point just add the anno
        if (this.state.canClosePoly) {
          this.props.addAnnotation(
            Annotations.Polygon(
              [...this.state.clickPoints].map((x) =>
                Point.scale(x, 1 / this.props.scale)
              ),
              "red"
            )
          );

          clickPoints = [];
        } else {
          // Add annotation
          clickPoints = [...clickPoints, clickPoint];
        }
      }

      this.props.selectAnnotation(this.state.hoveredAnnotation);
      this.setState({
        dragging: true,
        mouseStart: Point.Point(event.pageX, event.pageY),
        mousePos: Point.Point(event.pageX, event.pageY),
        clickPoints: clickPoints,
      });
    } else if (event.type === "mouseleave") {
      this.setState({
        dragging: false,
      });
    } else if (event.type === "mousemove") {
      const mousePos = Point.Point(event.pageX, event.pageY);
      const adjustedPos = Point.scale(
        Point.Point(mousePos.x - boundingRect.x, mousePos.y - boundingRect.y),
        1 / this.props.scale
      );
      let canClosePoly =
        this.state.clickPoints.length > 2 &&
        Point.dist(
          mousePos,
          Point.sum(
            this.state.clickPoints[0],
            Point.Point(boundingRect.x, boundingRect.y)
          )
        ) < 10;

      let hoveredAnnotation = -1;
      if (this.props.mode === Modes.Pan) {
        hoveredAnnotation = this.checkAnnotationHit(adjustedPos);
      }

      this.setState({
        mousePos: mousePos,
        annotationPos: adjustedPos,
        canClosePoly: canClosePoly,
        hoveredAnnotation: hoveredAnnotation,
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

    // Elements to draw if a drag is required
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

    if (this.props.mode === Modes.AnnotatePolygon) {
      const clickPoints = this.state.clickPoints;
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.fillStyle = "#ff000010";
      ctx.strokeStyle = "red";
      if (clickPoints.length > 0) {
        ctx.moveTo(clickPoints[0].x, clickPoints[0].y);
        for (let i = 1; i < clickPoints.length; i++) {
          ctx.lineTo(clickPoints[i].x, clickPoints[i].y);
        }
        if (!this.state.canClosePoly) {
          ctx.lineTo(
            this.state.mousePos.x - boundingRect.x,
            this.state.mousePos.y - boundingRect.y
          );
        }
        ctx.lineTo(clickPoints[0].x, clickPoints[0].y);
      }
      ctx.stroke();
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < this.props.annotations.length; i++) {
      const annotation = this.props.annotations[i];
      const isSelected = i === this.props.selectedAnnotation;
      const lineWidth = isSelected ? 3 : 1;
      switch (annotation.type) {
        case Annotations.AnnotationTypes.Circle:
          ctx.beginPath();
          ctx.lineWidth = lineWidth;
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
          ctx.lineWidth = lineWidth;
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
        case Annotations.AnnotationTypes.Polygon:
          ctx.beginPath();
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = "red";
          ctx.fillStyle = "#ff000010";

          ctx.moveTo(
            annotation.params[0].x * this.props.scale,
            annotation.params[0].y * this.props.scale
          );

          for (let i = 1; i < annotation.params.length; i++) {
            ctx.lineTo(
              annotation.params[i].x * this.props.scale,
              annotation.params[i].y * this.props.scale
            );
          }

          ctx.lineTo(
            annotation.params[0].x * this.props.scale,
            annotation.params[0].y * this.props.scale
          );

          ctx.stroke();
          ctx.closePath();
          ctx.fill();
          break;
        default:
          break;
      }
    }
  };

  RenderAnnotationHover = () => {
    const annotation = this.props.annotations[this.state.hoveredAnnotation];
    return annotation ? (
      <div
        className="annotationHover"
        style={{
          left: `${this.state.annotationPos.x}px`,
          top: `${this.state.annotationPos.y}px`,
        }}
      >
        <p className="annotationText">{annotation.name}</p>
      </div>
    ) : (
      <div
        style={{
          pointerEvents: "none",
        }}
      />
    );
  };

  render() {
    return (
      <div style={{ width: "100%", height: "100%", position: "absolute" }}>
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
        <this.RenderAnnotationHover />
      </div>
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
            doubleClick={{ disabled: true }}
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
                selectAnnotation={this.props.selectAnnotation}
                selectedAnnotation={this.props.selectedAnnotation}
                annotations={this.props.file.annotations}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      );
    }
  }
}
