import React from 'react'
import 'rc-slider/assets/index.css'
import '../App.css'
import { Range } from 'rc-slider'

class ChannelItem extends React.Component {
  render() {
    const selected = this.props.selectedChannel !== null && this.props.selectedChannel.index === this.props.index;
    const className = selected ? 'channelItemSelected' : 'channelItem'

    return (
      <div>
        <div className={className}
        onClick={() => this.props.channelSelected(this.props.channel, this.props.index)}>
          <div key='color' className='channelColorIcon' style={{backgroundColor: this.props.channel.channelColor}}/>
          <input key='name' type='text' className='channelTextInput' defaultValue={this.props.channel.name}/>
          <input key='selected' type='checkbox' checked={this.props.channel.enabled}
          onChange={() => this.props.onToggleChannel(this.props.index)} style={{width: '16px', height: '16px'}}/>
        </div>
        <hr className='channelHR'/>
      </div>);
  }
}

class ChannelInput extends React.Component {
  render() {
    if (this.props.selectedChannel != null) {
      return (<div style={{width: '80%'}}>
        <Range value={this.props.sliderRange} onChange={(e) => {this.props.sliderChanged(e)}}/>
      </div>);
    } else {
      return (<div/>);
    }
  }
}

export default class RightPane extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      file: this.props.file,
      selectedChannel: null,
      sliderRange: [1, 100]
    }

    this.channelSelected = this.channelSelected.bind(this)
    this.sliderChanged = this.sliderChanged.bind(this)
  }

  channelSelected(channel, index) {
    this.setState({
      selectedChannel: {channel, index},
      sliderRange: channel.threshold
    })
  }

  sliderChanged(values) {
    this.props.onThreshChannel(this.state.selectedChannel.index, values)
    this.setState({sliderRange: values})
  }

  componentDidUpdate(prevProps) {
    if (this.props.file !== prevProps.file) {
      this.setState({
        file: this.props.file,
        // Need to differentiate whether an entire different file is loaded
        // so the default selected stuff gets set right
        // selectedChannel: null,
        // sliderRange: [1, 100]
      })
    }
  }

  render() {
    if (this.state.file !== null) {
      return (<div className='rightPane'>
        <div className='channelList'>
          {this.state.file.idfArray.map((channel, index) => (
            <ChannelItem key={index} channel={channel} index={index}
            selectedChannel={this.state.selectedChannel} channelSelected={this.channelSelected}
            onToggleChannel={this.props.onToggleChannel}
            />
          ))}
        </div>
        <hr className='channelHR' style={{marginTop: '4px'}}/>
        <ChannelInput sliderChanged={this.sliderChanged} selectedChannel={this.state.selectedChannel} sliderRange={this.state.sliderRange}/>
      </div>)
    } else {
      return (<div/>);
    }
  }
}
