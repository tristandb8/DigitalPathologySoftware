import React, { Component } from "react";
import { getBitmap } from "../utils/tiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ReactComponent as LogoImage } from "../resources/Logo.svg";
import { Modes } from "../utils/canvasModes";
import AnnotatedCanvas from "./AnnotatedCanvas";
import grid from "../resources/GridFull.svg";

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
    if (!this.portRef.current) return;

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
    const loadedFile = this.props.file.imageData;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.file.type === "tiff") {
      // Update canvas size
      canvas.width = loadedFile.width;
      canvas.height = loadedFile.height;

      ctx.globalCompositeOperation = this.props.compositeOp;

      // Draw each channel overlapping
      getBitmap(loadedFile).then(function (layers) {
        for (let i = 0; i < layers.length; i++) {
          ctx.drawImage(layers[i], 0, 0);
          layers[i].close();
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
    // this.annotationCanvasRef.current?.updateCanvas();
  }

  componentDidUpdate(oldProps) {
    if (
      oldProps.file !== this.props.file ||
      oldProps.compositeOp !== this.props.compositeOp
    ) {
      this.updateCanvas();
    } else if (oldProps.grid !== this.props.grid) {
      if (this.gridRef.current)
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
      const backgroundSelected = this.props.selectedAnnotation === 0 ? 2 : 1;
      const borderColor =
        this.props.file.annotations == null
          ? "red 1px solid"
          : this.props.file.annotations[0].color.hex +
            " " +
            backgroundSelected +
            "px solid";
      return (
        <div style={{ flex: "0 1 auto", height: "100%" }} ref={this.portRef}>
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
              <canvas
                ref={this.canvasRef}
                className={
                  this.props.selectedAnnotation === 0
                    ? "displayCanvasSelected"
                    : "displayCanvas"
                }
                style={{
                  outline: borderColor,
                }}
              />
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
                width={this.props.file.imageData.width}
                height={this.props.file.imageData.height}
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
