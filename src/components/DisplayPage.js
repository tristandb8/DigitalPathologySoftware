import React, { Component } from 'react'
import {ReactComponent as RulerButton} from '../resources/Ruler.svg'
import {ReactComponent as GridButton} from '../resources/Grid.svg'
import {ReactComponent as ExpandButton} from '../resources/Expand.svg'
import {ReactComponent as TapButton} from '../resources/Tap.svg'
import {ReactComponent as ZoomButton} from '../resources/SearchRight.svg'
import {ReactComponent as MeasureButton} from '../resources/RulerRound.svg'
import {ReactComponent as SquareButton} from '../resources/ShadedSquare.svg'
import {ReactComponent as CircleButton} from '../resources/ShadedCircle.svg'
import {ReactComponent as CloseButton} from '../resources/Close.svg'
import '../App.css'

import PanZoomCanvas from './PanZoomCanvas'

class Toolbar extends Component {
  render() {
    return (
      <div className='toolbar'>
        <div className='toolbarButton'>
          <RulerButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='toolbarButton'>
          <GridButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='verticalRule'/>
        <div className='toolbarButton'>
          <ExpandButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='toolbarButton'>
          <TapButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='toolbarButton'>
          <ZoomButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='verticalRule'/>
        <div className='toolbarButton'>
          <MeasureButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='toolbarButton'>
          <SquareButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
        <div className='toolbarButton'>
          <CircleButton style={{fill: '#1B1B1B', height: '24px', width: '24px'}}/>
        </div>
      </div>
    );
  }
}

class Tabbar extends Component {
  render() {
    return (
    <div className='tabbar'>
      <div className='tab'>
        <p className='tabTitle'>tab 1 with some extra words</p>
        <CloseButton style={{fill: '#1B1B1B', height: '12px', width: '12px', flexShrink: '0'}}/>
      </div>
      <div className='tabSelected'>
        <p className='tabTitle'>tab 2</p>
        <CloseButton style={{fill: '#1B1B1B', height: '12px', width: '12px', flexShrink: '0'}}/>
      </div>
      <div className='tab'>
        <p className='tabTitle'>tab 3</p>
        <CloseButton style={{fill: '#1B1B1B', height: '12px', width: '12px', flexShrink: '0'}}/>
      </div>
    </div>
    );
  }
}

export default class DisplayPage extends Component {
  constructor(props) {
    super(props)
    this.canvasRef = React.createRef()
  }

  render() {
    return (
        <div className='displayPage'>
          <Tabbar/>
          <Toolbar/>
          <PanZoomCanvas ref={this.canvasRef} file={this.props.file}/>
        </div>
    );
  }
}
