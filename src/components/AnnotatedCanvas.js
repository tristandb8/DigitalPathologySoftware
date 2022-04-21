import React, { Component } from "react";
import { Modes } from "../utils/canvasModes";
import * as Point from "../utils/pointUtils";
import * as Annotations from "../utils/annotations";

class AnnotationCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.annotations !== this.props.annotations ||
      oldProps.selectedAnnotation !== this.props.selectedAnnotation
    ) {
      this.updateCanvas();
    }
  }

  updateCanvas = () => {
    const canvas = this.canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const boundingRect = this.canvasRef.current.getBoundingClientRect();
    canvas.width = boundingRect.width;
    canvas.height = boundingRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.props.annotations?.length; i++) {
      const annotation = this.props.annotations[i];
      const isSelected = i === this.props.selectedAnnotation;
      const lineWidth = isSelected ? 3 : 1;
      const backgroundFill =
        i !== 0 ||
        (i === 0 &&
          (annotation.useNucleusDetection || annotation.useCytoDetection));

      if (
        typeof annotation.fill === "string" ||
        annotation.fill instanceof String
      ) {
        ctx.fillStyle = annotation.fill;
      } else {
        const pattern = ctx.createPattern(annotation.fill, "no-repeat");
        const transform = ctx.getTransform();

        transform.scaleSelf(
          this.props.scale,
          this.props.scale,
          this.props.scale
        );
        pattern.setTransform(transform);
        ctx.fillStyle = pattern;
      }

      switch (annotation.type) {
        case Annotations.AnnotationTypes.Circle:
          ctx.beginPath();
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = annotation.color.hex;
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
          if (backgroundFill) {
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = annotation.color.hex;
            if (i !== 0)
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
            if (i !== 0) ctx.stroke();
            ctx.closePath();
          }
          break;
        case Annotations.AnnotationTypes.Polygon:
          ctx.beginPath();
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = annotation.color.hex;

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

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          imageRendering: "pixelated",
        }}
      />
    );
  }
}

class DrawCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);

    this.state = {
      mouseStart: Point.ORIGIN,
      mousePos: Point.ORIGIN,
      dragging: false,
      clickPoints: [],
      canClosePoly: false,
    };
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.scale !== this.props.scale ||
      oldProps.mode !== this.props.mode
    ) {
      this.setState({
        mouseStart: Point.ORIGIN,
        mousePos: Point.ORIGIN,
        clickPoints: [],
        dragging: false,
      });
      this.updateCanvas();
    }
  }

  checkAnnotationHit = (hit) => {
    for (let anni = this.props.annotations?.length - 1; anni > 0; anni--) {
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

    return 0;
  };

  handleMouseEvent = (event) => {
    const boundingRect = this.canvasRef.current.getBoundingClientRect();

    if (event.type === "mouseup" && event.button === 0) {
      const clickPos = Point.Point(event.pageX, event.pageY);
      this.setState({
        mouseStart: clickPos,
        mousePos: clickPos,
        dragging: false,
      });
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
            if (r > 1)
              this.props.addAnnotation(
                Annotations.Circle(
                  start.x / this.props.scale,
                  start.y / this.props.scale,
                  r / this.props.scale
                )
              );
            break;
          case Modes.AnnotateSquare:
            if (start.x > end.x) [start.x, end.x] = [end.x, start.x];
            if (start.y > end.y) [start.y, end.y] = [end.y, start.y];
            if (Math.abs(start.x - end.x) > 1 && Math.abs(start.y - end.y) > 1)
              this.props.addAnnotation(
                Annotations.Square(
                  start.x / this.props.scale,
                  start.y / this.props.scale,
                  (end.x - start.x) / this.props.scale,
                  (end.y - start.y) / this.props.scale
                )
              );
            break;
          default:
            break;
        }
      }
    } else if (event.type === "mousedown" && event.button === 0) {
      const clickPos = Point.Point(event.pageX, event.pageY);
      if (this.props.mode === Modes.Pan) {
        const adjustedPos = Point.scale(
          Point.Point(clickPos.x - boundingRect.x, clickPos.y - boundingRect.y),
          1 / this.props.scale
        );
        const clickedAnnotationIndex = this.checkAnnotationHit(adjustedPos);
        this.props.selectAnnotation(clickedAnnotationIndex);
      }
      this.setState((prevState) => ({
        mouseStart: clickPos,
        mousePos: clickPos,
        clickPoints: [
          ...prevState.clickPoints,
          Point.Point(
            event.pageX - boundingRect.x,
            event.pageY - boundingRect.y
          ),
        ],
        dragging: true,
      }));

      if (this.state.canClosePoly) {
        this.props.addAnnotation(
          Annotations.Polygon(
            [...this.state.clickPoints].map((x) =>
              Point.scale(x, 1 / this.props.scale)
            )
          )
        );

        this.setState({
          canClosePoly: false,
          clickPoints: [],
        });
      }
    } else if (event.type === "mouseleave") {
      this.setState({
        mouseStart: Point.ORIGIN,
        mousePos: Point.ORIGIN,
        clickPoints: [],
        dragging: false,
      });
    } else if (event.type === "mousemove") {
      const mousePos = Point.Point(event.pageX, event.pageY);
      const canClosePoly =
        this.state.clickPoints.length > 2 &&
        Point.dist(
          mousePos,
          Point.sum(
            this.state.clickPoints[0],
            Point.Point(boundingRect.x, boundingRect.y)
          )
        ) < 10;

      this.setState({
        mousePos: mousePos,
        canClosePoly: canClosePoly,
      });
      this.updateCanvas();
    }
  };

  updateCanvas = () => {
    const canvas = this.canvasRef?.current;
    if (!canvas) return;
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
  };

  render() {
    return (
      <canvas
        onMouseDown={this.handleMouseEvent}
        onMouseMove={this.handleMouseEvent}
        onMouseUp={this.handleMouseEvent}
        onMouseLeave={this.handleMouseEvent}
        ref={this.canvasRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />
    );
  }
}

export default class AnnotatedCanvas extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%", position: "absolute" }}>
        <AnnotationCanvas
          selectedAnnotation={this.props.selectedAnnotation}
          annotations={this.props.annotations}
          scale={this.props.scale}
        />
        <DrawCanvas
          mode={this.props.mode}
          scale={this.props.scale}
          onZoom={this.props.onZoom}
          annotations={this.props.annotations}
          selectAnnotation={this.props.selectAnnotation}
          addAnnotation={this.props.addAnnotation}
        />
      </div>
    );
  }
}
