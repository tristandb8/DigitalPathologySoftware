import React, { Component } from 'react'
import styled from 'styled-components'
import PanZoomCanvas from './PanZoomCanvas'

export default class DisplayPage extends Component {
  constructor(props) {
    super(props)
    this.canvasRef = React.createRef()
  }

  render() {
    return (
      <Display>
        <PanZoomCanvas ref={this.canvasRef} file={this.props.file}/>
      </Display>
    );
  }
}

const Display = styled.div`
  background: #1B1B1B;
  width: 100%;
  height: 100%;
  overflow: hidden;
`
