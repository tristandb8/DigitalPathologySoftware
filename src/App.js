import React, { Component } from 'react'
import { tiffImage } from './utils/TiffModel'
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
    }
    
    this.handleChannelToggle = this.handleChannelToggle.bind(this)
    this.handleChannelThresh = this.handleChannelThresh.bind(this)
    this.canvasRef = React.createRef(null)
  }
  
  handleChannelToggle(index) {
    let items = [...this.state.loadedFile.idfArray]
    let item = {...items[index]}
    item.enabled = !item.enabled
    items[index] = item
    
    this.setState(prevState => ({
      loadedFile: {...prevState.loadedFile,
        idfArray: items
      }
    }))
  }

  handleChannelThresh(index, range) {
    let items = [...this.state.loadedFile.idfArray]
    let item = {...items[index]}
    item.threshold = range
    items[index] = item
    
    this.setState(prevState => ({
      loadedFile: {...prevState.loadedFile,
        idfArray: items
      }
    }))
  }
  
  componentDidMount() {
    ipcRenderer.on('new-image', (event, fileContent) => {
      let file
      
      if (fileContent.type === 'tiff') {
        file = tiffImage(fileContent.data)
      } else if (fileContent.type === 'image') {
        file = fileContent.data
      }
      
      this.setState({
        loadedFileType: fileContent.type,
        loadedFile: file,
      })

      this.canvasRef.current.resetView()
    })
  }

  render() {
    return (
      <div className='App'>
        <Split>
          <Pane></Pane>
          <Display>
            <PanZoomCanvas ref={this.canvasRef} file={this.state}/>
          </Display>
          <ChannelPane file={this.state} onToggleChannel={this.handleChannelToggle} onThreshChannel={this.handleChannelThresh}/>
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
  width: 300px;
`

const Split = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  height: 100vh;
`
