import React, { Component } from 'react'
import { TiffModel } from './TiffModel'
import styled from 'styled-components'
import './App.css'
const { ipcRenderer } = window.require('electron')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loadedFileType: null,
      loadedFile: null
    }

    this.canvasRef = React.createRef(null)
  }
  
  componentDidMount() {
    ipcRenderer.on('new-image', (event, fileContent) => {
      let file

      if (fileContent.type === 'tiff') {
        const tiffFile = new TiffModel(fileContent.data)
        file = tiffFile
      } else if (fileContent.type === 'image') {
        file = fileContent.data
      }

      this.setState({
        loadedFileType: fileContent.type,
        loadedFile: file
      })
    })
  }

  componentDidUpdate() {
    const canvas = this.canvasRef.current
    const ctx = canvas.getContext('2d')
    const file = this.state.loadedFile
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state.loadedFileType === 'tiff')
    {
      canvas.width = file.width
      canvas.height = file.height
      // ctx.globalAlpha = 0.5
      ctx.globalCompositeOperation='color'
      
      file.getBitmap().then(function(layers) {
        console.log(`drawing ${layers.length} layers`)
        for (let i = 0; i < layers.length; i++) {
          ctx.drawImage(layers[i], 0, 0)
        }
      })
    } else {
      const img = new Image()
      img.src = file
      canvas.width = 300
      canvas.height = 150
      ctx.drawImage(img, 0, 0)
      console.log(canvas.height)
    }
  }
  
  render() {
    return (
      <div className='App'>
        <Split>
          <Pane></Pane>
          <Display>
            <canvas ref={this.canvasRef}></canvas>
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
  