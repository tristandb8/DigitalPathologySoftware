import React from 'react'
import { getBitmap } from '../utils/TiffModel'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

export default class PanZoomCanvas extends React.Component {
  constructor(props) {
    super(props)
    this.canvasRef = React.createRef(null)
    this.viewRef = React.createRef(null)

    this.resetView = this.resetView.bind(this)
  }

  resetView() {
    this.viewRef.current.resetTransform(0, 'easeOut')
    this.viewRef.current.centerView(undefined, 0, 'easeOut')
  }

  updateCanvas() {
    const canvas = this.canvasRef.current
    const ctx = canvas.getContext('2d')
    const loadedFile = this.props.file.loadedFile

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.file.loadedFileType === 'tiff')
    {
      // Update canvas size
      canvas.width = loadedFile.width
      canvas.height = loadedFile.height

      // Ideally this would be changeable via dropdown
      ctx.globalCompositeOperation = 'color'
      
      // Draw each channel overlapping
      getBitmap(loadedFile).then(function(layers) {
        // console.log(`drawing ${layers.length} layers`)
        for (let i = 0; i < layers.length; i++) {
            ctx.drawImage(layers[i], 0, 0)
        }
      })
    } else {
      // TODO: FIX PNG RENDERING (not sure how this broke)
      const img = new Image()
      img.src = loadedFile
      canvas.width = 300
      canvas.height = 150
      ctx.drawImage(img, 0, 0)
    }
    
    // this.resetView()
  }
  
  componentDidUpdate(oldProps) {
    if (oldProps.file !== this.props.file) {
      this.updateCanvas()
    }
  }
  
  render() {
    return (
      <TransformWrapper ref={this.viewRef} initialScale={1}>
        <TransformComponent wrapperStyle={{width: '100%', height: '100%'}}>
          <canvas ref={this.canvasRef} style={{imageRendering: 'pixelated', outline: 'red 1px solid'}}/>
        </TransformComponent>
      </TransformWrapper>
    )
  }
}
