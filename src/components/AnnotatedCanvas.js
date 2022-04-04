import React, { Component } from "react";
import { Modes } from "../utils/canvasModes";
import * as Point from "../utils/pointUtils";
import * as Annotations from "../utils/annotations";

export default class AnnotatedCanvas extends Component {
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
      oldProps.mode !== this.props.mode
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
    let drawUpdate = true;

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
            drawUpdate = false;
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
            drawUpdate = false;
            break;
          default:
            break;
        }
        this.setState({
          dragging: false,
        });
      }
    } else if (event.type === "mousedown" && event.button === 0) {
      let clickPoints = [...this.state.clickPoints];
      this.props.selectAnnotation(this.state.hoveredAnnotation);
      drawUpdate = false;

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
          drawUpdate = false;
        } else {
          clickPoints = [...clickPoints, clickPoint];
          drawUpdate = true;
        }
      }

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

      if (this.props.mode === Modes.Pan) drawUpdate = false;
      if (
        (this.props.mode === Modes.Measure ||
          this.props.mode === Modes.AnnotateCircle ||
          this.props.mode === Modes.AnnotateSquare) &&
        !this.state.dragging
      )
        drawUpdate = false;

      this.setState({
        mousePos: mousePos,
        annotationPos: adjustedPos,
        canClosePoly: canClosePoly,
        hoveredAnnotation: hoveredAnnotation,
      });
    }

    if (drawUpdate) this.updateCanvas();
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

    const scale = this.props.scale;
    const annotations = this.props.annotations;
    const selected = this.props.selectedAnnotation;

    Annotations.getAnnotationFills(this.props.annotations).then(function (
      fillStyles
    ) {
      for (let i = 0; i < fillStyles.length; i++) {
        const annotation = annotations[i];
        const isSelected = i === selected;
        const lineWidth = isSelected ? 3 : 1;

        if (
          typeof fillStyles[i] === "string" ||
          fillStyles[i] instanceof String
        ) {
          ctx.fillStyle = fillStyles[i];
        } else {
          const pattern = ctx.createPattern(fillStyles[i], "no-repeat");
          const transform = ctx.getTransform();
          switch (annotation.type) {
            case Annotations.AnnotationTypes.Circle:
              transform.translateSelf(
                (annotation.params.x - annotation.params.r) * scale,
                (annotation.params.y - annotation.params.r) * scale,
                0
              );
              break;
            case Annotations.AnnotationTypes.Square:
              transform.translateSelf(
                annotation.params.x * scale,
                annotation.params.y * scale,
                0
              );
              break;
            case Annotations.AnnotationTypes.Polygon:
              let minX = Number.MAX_SAFE_INTEGER,
                minY = Number.MAX_SAFE_INTEGER;

              for (const coord of annotation.params) {
                minX = Math.min(minX, coord.x);
                minY = Math.min(minY, coord.y);
              }

              transform.translateSelf(minX * scale, minY * scale, 0);
              break;
            default:
              break;
          }
          transform.scaleSelf(scale, scale, scale);
          pattern.setTransform(transform);
          ctx.fillStyle = pattern;
        }

        switch (annotation.type) {
          case Annotations.AnnotationTypes.Circle:
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = annotation.color;
            ctx.arc(
              annotation.params.x * scale,
              annotation.params.y * scale,
              annotation.params.r * scale,
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
            ctx.strokeStyle = "red";
            ctx.strokeRect(
              annotation.params.x * scale,
              annotation.params.y * scale,
              annotation.params.w * scale,
              annotation.params.h * scale
            );
            ctx.fillRect(
              annotation.params.x * scale,
              annotation.params.y * scale,
              annotation.params.w * scale,
              annotation.params.h * scale
            );
            ctx.stroke();
            ctx.closePath();
            break;
          case Annotations.AnnotationTypes.Polygon:
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = "red";

            ctx.moveTo(
              annotation.params[0].x * scale,
              annotation.params[0].y * scale
            );

            for (let i = 1; i < annotation.params.length; i++) {
              ctx.lineTo(
                annotation.params[i].x * scale,
                annotation.params[i].y * scale
              );
            }

            ctx.lineTo(
              annotation.params[0].x * scale,
              annotation.params[0].y * scale
            );

            ctx.stroke();
            ctx.closePath();
            ctx.fill();
            break;
          default:
            break;
        }
      }
    });
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
            imageRendering: "pixelated",
          }}
        />
        <this.RenderAnnotationHover />
      </div>
    );
  }
}
