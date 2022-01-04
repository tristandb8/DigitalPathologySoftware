import React from 'react'
import styled from 'styled-components'
import 'rc-slider/assets/index.css'
import { Range } from 'rc-slider'

export default class ChannelPane extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      file: this.props.file,
      onToggleChannel: this.props.onToggleChannel,
      onThreshChannel: this.props.onThreshChannel,
      selectedChannel: null,
      sliderRange: [0, 100]
    }

    this.channelListRender = this.channelListRender.bind(this)
    this.slidersRender = this.slidersRender.bind(this)
    this.channelToggle = this.channelToggle.bind(this)
    this.sliderChange = this.sliderChange.bind(this)
    this.channelSelected = this.channelSelected.bind(this)
  }

  componentDidUpdate(prevProps) {
    if (this.props.file !== prevProps.file) {
      this.setState({
        file: this.props.file,
      })
    }
  }

  channelToggle(props) {
    const index = props.index
    return( 
      <label className='switch'>
        <input checked={
          this.state.file.loadedFile.idfArray[index].enabled}
          type='checkbox'
          onChange={() => this.state.onToggleChannel(index)}
          />
      </label>
    )
  }
  
  channelSelected(channel, index) {
    this.setState({
      selectedChannel: {channel, index},
      sliderRange: channel.threshold
    })
  }

  renderChannel(channel, index) {
    // This should become its own component to handle the switch and mouseover
    return (
      <ChannelCell key={index} onClick={() => this.channelSelected(channel, index)}>
        <ChannelCellContent>
          <ColorBox color={channel.channelColor}/>
          <p>{channel.name}</p>
          <this.channelToggle index={index}/>
        </ChannelCellContent>
      </ChannelCell>
    )
  }

  channelListRender() {
    if (this.state.file.loadedFile === null) {
      return <p>No file loaded</p>
    } else {
      return (
        <div style={{height: '75%', overflowY: 'scroll', overflowX: 'hidden'}}>
          {this.state.file.loadedFile.idfArray.map(this.renderChannel, this)}
        </div>
      )
    }
  }

  sliderChange(values) {
    this.state.onThreshChannel(this.state.selectedChannel.index, values)
    this.setState({sliderRange: values})
  }

  slidersRender() {
    // todo: add a ref to reset slider when the selected channel changes
    if (this.state.selectedChannel != null) {
      return (<div style={{width: '80%'}}>
        <Range value={this.state.sliderRange} onChange={(e) => {this.sliderChange(e)}}/>
      </div>)
    } else {
      return (<div/>)
    }
  }

  render() {
    return (<Pane>
      <this.channelListRender/>
      <this.slidersRender/>
    </Pane>)
  }
}

const ColorBox = styled.div`
  background: ${props => props.color ? props.color : 'black'};
  width: 16px;
  height: 16px;
  outline: gray 1px solid; 
`

const Pane = styled.div`
  background: #F3F3F3;
  width: 400px;
`

// padding: 2px 4px 2px 4px;
const ChannelCell = styled.div`
  position: static;
  width: 100%;
  height: 32px;

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0px 0px;
`
const ChannelCellContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  
  width: 100%;
  height: 12px;
  left: 8px;
  top: 8px;
`
