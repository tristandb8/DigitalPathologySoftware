import React, { Component } from 'react'
import styled from 'styled-components'
import PanZoomCanvas from './PanZoomCanvas'

export default class DisplayPage extends Component {
  constructor(props) {
    super(props)
    this.canvasRef = React.createRef()
  }

  render() {
    if (this.props.file.loadedFile != null) {
      return (
        <Display>
          <PanZoomCanvas ref={this.canvasRef} file={this.props.file}/>
        </Display>
      );
    } else {
      return (<Display/>);
    }
  }
}

const Display = styled.div`
  background: #1B1B1B;
  width: 100%;
  height: 100%;
  overflow: hidden;
`
