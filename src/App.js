import React, { Component } from 'react'
import { TiffModel } from './utils/TiffModel'
import styled from 'styled-components'
import './App.css'
import PanZoomCanvas from './components/PanZoomCanvas'
import {ChannelPane} from './components/ChannelPane';
import update from 'immutability-helper';

const { ipcRenderer } = window.require('electron')

const channelsArr = [
  {channelName: "H3", color:"#FE2828", display: false},
  {channelName: "HMA", color:"#2CFE28", display: false},
  {channelName: "INS", color:"#283EFE", display: false},
  {channelName: "CD44", color:"#1E0404", display: false},
  {channelName: "WOW32", color:"#28FEF1", display: false},
  {channelName: "LOL", color:"#FFC42D", display: false},
  {channelName: "CD38", color:"#FE2882", display: false},
]

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loadedFileType: null,
      loadedFile: null,
      channels: channelsArr ,
    }
    
    console.log(this.state.channels[0]);

    this.handleChannelToggle = this.handleChannelToggle.bind(this);
  }

  handleChannelToggle(e) {
    const index = e.index;
    const channelsCopy = this.state.channels;
    channelsCopy[index].display = true;

    this.setState({
      channels: channelsCopy
    },() => {console.log(this.state.channels)});
  }

  componentDidMount() {
    ipcRenderer.on('new-image', (event, fileContent) => {
      let file

      if (fileContent.type === 'tiff') {
        file = new TiffModel(fileContent.data)
      } else if (fileContent.type === 'image') {
        file = fileContent.data
      }

      this.setState({
        loadedFileType: fileContent.type,
        loadedFile: file,
      })
    })
  }

  render() {
    console.log('passing:')
    console.log(this.state)
    return (
      <div className='App'>
        <Split>
          <Pane></Pane>
          <Display>
            <PanZoomCanvas file={this.state}/>
          </Display>
          <Pane></Pane>
          <ChannelPane channels={this.state.channels} handleChannelToggle={this.handleChannelToggle}/>
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
  