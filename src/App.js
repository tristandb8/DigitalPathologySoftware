import React, { Component } from 'react'
import { TiffModel } from './utils/TiffModel'
import styled from 'styled-components'
import './App.css'
import PanZoomCanvas from './components/PanZoomCanvas'
import ChannelPane from './components/ChannelPane';

const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loadedFileType: null,
      loadedFile: null,
      channels: [] ,
    }
    
    this.handleChannelToggle = this.handleChannelToggle.bind(this);
  }

  handleChannelToggle(e) {
    const index = e.index;
    const channelsCopy = this.state.channels;
    channelsCopy[index].display = !channelsCopy[index].display;

    this.setState({
      channels: channelsCopy
    },() => {console.log(this.state.channels)});
  }

  componentDidMount() {
    ipcRenderer.on('new-image', (event, fileContent) => {
      let file
      const channelsArr = [];

      if (fileContent.type === 'tiff') {
        file = new TiffModel(fileContent.data)
        file.getBitmap().then(function(layers) {
          for(let i = 0; i < layers.length; i++) {
            const str = "layer_" + i;
            channelsArr.push({channelName:{str}, color: "#f00", display: true})
          }
        })
      } else if (fileContent.type === 'image') {
        file = fileContent.data
      }
      
      this.setState({
        loadedFileType: fileContent.type,
        loadedFile: file,
        channels: channelsArr,
      })
    })
  }

  render() {
    console.log('passing:')
    console.log(this.state)
    return (
      <div className='App'>
        <ChannelPane channels={this.state.channels} handleChannelToggle={this.handleChannelToggle}/>
        <Split>
          <Pane></Pane>
          <Display>
            {/* this line needs to be modified since state can include more than just file */}
            <PanZoomCanvas file={this.state}/> 
          </Display>
          <Pane></Pane>
        </Split>
      </div>
    )
  }
}

export default App

const Display = styled.div`
  background: #1B1B1B;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const Pane = styled.div`
  background: #F3F3F3;
  width: 200px;
`
const Split = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  height: 100vh;
`
  