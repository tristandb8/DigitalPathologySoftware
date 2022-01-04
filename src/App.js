import React, { Component } from 'react'
import { tiffImage } from './utils/TiffModel'
import styled from 'styled-components'
import DisplayPage from './components/DisplayPage'
import ChannelPane from './components/ChannelPane';
import RightPane from './components/RightPane';
import LeftPane from './components/LeftPane'
import './App.css'

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
    this.displayPageRef = React.createRef(null)
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

      this.displayPageRef.current.canvasRef.current.resetView()
    })
  }

  render() {
    return (
      <div className='App'>
        <Split>
          <LeftPane/>
          <DisplayPage ref={this.displayPageRef} file={this.state}/>
          <RightPane file={this.state.loadedFile}/>
          {/* <ChannelPane file={this.state} onToggleChannel={this.handleChannelToggle} onThreshChannel={this.handleChannelThresh}/> */}
        </Split>
      </div>
    )
  }
}

export default App

const Split = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  height: 100vh;
`
