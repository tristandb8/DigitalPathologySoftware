import React from 'react';
import styled from 'styled-components'

export default class ChannelPane extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      file: this.props.file,
      onToggleChannel: this.props.onToggleChannel,
    }

    this.channelListRender = this.channelListRender.bind(this)
    this.channelToggle = this.channelToggle.bind(this)
  }

  componentDidUpdate(prevProps) {
    if (this.props.file !== prevProps.file) {
      this.setState({
        file: this.props.file,
      })
    }
  }

  channelToggle(props) {
    // This should become its own component to handle the switch easier
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

  renderChannel(channel, index) {
    return (
      <ChannelCell key={index}>
        <ChannelCellContent>
          <ColorBox color={channel.channelColor}/>
          <p>{channel.name}</p>
          <this.channelToggle index={index}/>
        </ChannelCellContent>
      </ChannelCell>
    );
  }

  channelListRender() {
    if (this.state.file.loadedFile === null) {
      return <p>No file loaded</p>
    } else {
      return (
        <div style={{height: '500px', overflowY: 'scroll', overflowX: 'hidden'}}>
          {this.state.file.loadedFile.idfArray.map(this.renderChannel, this)}
        </div>
      )
    }
  }

  render() {
    return (<Pane>
      <this.channelListRender/>
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
