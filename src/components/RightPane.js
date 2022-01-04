import React from 'react'
import 'rc-slider/assets/index.css'
import '../App.css'
import { Range } from 'rc-slider'

// class ChannelItem extends React.Component {
//   // props: channelSelected fn, channel, index, onToggleChannel
//   constructor(props) {
//     super(props)
//   }

//   render() {
//     return (
//       <div style={{width: '100%', height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
//         key={this.props.index} onClick={() => this.props.channelSelected()}
//       >
//         <div style={{backgroundColor: this.props.channel.channelColor}}/>
//         <p>{this.props.channel.channelName}</p>
//         <label className='switch'>
//           <input checked={this.props.channel.enabled}
//             type='checkbox'
//             onChange={() => this.props.onToggleChannel(this.props.index)}
//           />
//         </label>
//       </div>
//     )
//   }
// }

class ChannelItem extends React.Component {
  render() {
    return (
      <div className='channelItem'>
        <div className='channelColorIcon' style={{backgroundColor: this.props.background}}/>
        <input type='text' className='channelTextInput' defaultValue={this.props.text}/>
        <input type='checkbox' style={{width: '16px', height: '16px'}}/>
      </div>)
  }
}

export default class RightPane extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      // file: this.props.file,
      // onToggleChannel: this.props.onToggleChannel,
      // onThreshChannel: this.props.onThreshChannel,
      // selectedChannel: null,
      // sliderRange: [1, 100]
    }

    // this.channelListRender = this.channelListRender.bind(this)
    // this.slidersRender = this.slidersRender.bind(this)
    // this.channelToggle = this.channelToggle.bind(this)
    // this.sliderChange = this.sliderChange.bind(this)
    // this.channelSelected = this.channelSelected.bind(this)
  }
  
  // componentDidUpdate(prevProps) {
  //   if (this.props.file !== prevProps.file) {
  //     this.setState({
  //       file: this.props.file,
  //       selectedChannel: null,
  //       sliderRange: [1, 100]
  //     })
  //   }
  // }

  // channelToggle(props) {
  //   const index = props.index
  //   return( 
  //     <label className='switch'>
  //       <input checked={
  //         this.state.file.loadedFile.idfArray[index].enabled}
  //         type='checkbox'
  //         onChange={() => this.state.onToggleChannel(index)}
  //         />
  //     </label>
  //   )
  // }

  // channelSelected(channel, index) {
  //   this.setState({
  //     selectedChannel: {channel, index},
  //     sliderRange: channel.threshold
  //   })
  // }

  render() {
    return (<div className='rightPane'>
      <div className='channelList'>
        <ChannelItem text='H3' background='red'/>
        <hr className='channelHR'/>
        <ChannelItem text='HMA' background='green'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
        <hr className='channelHR'/>
        <ChannelItem text='INS' background='blue'/>
      </div>
    </div>)
  }
}
