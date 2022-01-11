import React from "react";
import { getBitmap } from "../utils/TiffModel";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ReactComponent as Grid } from "../resources/GridFull.svg";

export default class PanZoomCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef(null);
    this.viewRef = React.createRef(null);
    this.resetView = this.resetView.bind(this);
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
    }
  }

  render() {
    if (this.props.file.loadedFile == null) {
      return <div />;
    } else {
      // const scale = this.viewRef.current ? this.viewRef.current.state.scale : 1;

      return (
        <div style={{ width: "100%", height: "100%" }}>
          {/* <Grid
            style={{
              width: "50%",
              height: "50%",
              position: "absolute",
              transform: `scale(${scale})`,
            }}
          /> */}
          <TransformWrapper
            ref={this.viewRef}
            initialScale={1}
            limitToBounds={false}
            onZoom={this.props.onZoom}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <canvas
                ref={this.canvasRef}
                style={{
                  imageRendering: "pixelated",
                  border: "red 1px solid",
                  backgroundColor: "black",
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      );
    }
  }
}
