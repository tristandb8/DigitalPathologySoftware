import { Canvas } from 'konva/lib/Canvas'
import React from 'react'
import { Stage, Layer, Rect, Text, Circle, Line, Image } from 'react-konva'
import useImage from 'use-image'

const DisplayImage = (props) => {
  const imageData = props.imageData != null ? props.imageData : 'https://jclem.nyc3.cdn.digitaloceanspaces.com/pan-zoom-canvas-react/grid.svg'
  if (props.imageData != null)
    console.log(props.imageData)
  const [image] = useImage(imageData);

  // if (imageData != null) 
  //   return (<img src={imageData} alt='' style={{
  //     borderColor: 'red',
  //     borderStyle: 'solid',
  //     borderWidth: 2,
  //     overflow: 'hidden',
  //   }}/>)

  return (<Image image={image}/>)
}

class DataImage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      image: null
    }
  }

  componentDidMount() {
    this.loadImage();
  }
  componentDidUpdate(oldProps) {
    if (oldProps.src !== this.props.src) {
      this.loadImage();
    }
  }

  componentWillUnmount() {
    this.image.removeEventListener('load', this.handleLoad);
  }

  loadImage() {
    this.image = new window.Image();

    if (this.props.src == null) {
      this.image.src = 'https://jclem.nyc3.cdn.digitaloceanspaces.com/pan-zoom-canvas-react/grid.svg'
    } else if (this.props.src.type.localeCompare('image') === 0) {
      this.image.src = this.props.src.data;
    } else if (this.props.src.type.localeCompare('tiff') === 0) {
      
      console.log('tiff file loaded into kcanvas')
      const blob = new Blob([this.props.src.data], {'type': 'image/png'})
      const srcBlob = URL.createObjectURL(blob)
      this.image.src = srcBlob
    } else {
      this.image.src = 'https://jclem.nyc3.cdn.digitaloceanspaces.com/pan-zoom-canvas-react/grid.svg'
    }

    this.image.addEventListener('load', this.handleLoad);
  }

  handleLoad = () => {
    // after setState react-konva will update canvas and redraw the layer
    // because "image" property is changed
    this.setState({
      image: this.image
    });
    // if you keep same image object during source updates
    // you will have to update layer manually:
    // this.imageNode.getLayer().batchDraw();
  }

  render() {
    return (
      <Image
        x={this.props.x}
        y={this.props.y}
        image={this.state.image}
        ref={node => {
          this.imageNode = node;
        }}
      />
    )
  }
}

export function KCanvas(props) {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Some text on canvas" fontSize={15} />
        <Rect
          x={20}
          y={50}
          width={100}
          height={100}
          fill="red"
          shadowBlur={10}
        />
        <Circle x={200} y={100} radius={50} fill="green" />
        <DataImage src={props.imageData}/>
        <Line
          x={20}
          y={200}
          points={[0, 0, 100, 0, 100, 100]}
          tension={0.5}
          closed
          stroke="black"
          fillLinearGradientStartPoint={{ x: -50, y: -50 }}
          fillLinearGradientEndPoint={{ x: 50, y: 50 }}
          fillLinearGradientColorStops={[0, 'red', 1, 'yellow']}
        />
      </Layer>
    </Stage>)
}
