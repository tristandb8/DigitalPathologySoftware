import React from "react";
import "rc-slider/assets/index.css";
import "../App.css";
import { Range } from "rc-slider";
import { SketchPicker } from "react-color";

class ChannelItem extends React.Component {
  render() {
    const selected =
      this.props.selectedChannel !== null &&
      this.props.selectedChannel.index === this.props.index;
    const className = selected ? "channelItemSelected" : "channelItem";

    return (
      <div>
        <div
          className={className}
          onClick={() =>
            this.props.channelSelected(this.props.channel, this.props.index)
          }
        >
          <div
            key="color"
            className="channelColorIcon"
            style={{ backgroundColor: this.props.channel.channelColor }}
          />
          <input
            key="name"
            type="text"
            className="channelTextInput"
            onChange={(e) => {
              this.props.onNameChannel(this.props.index, e.target.value);
            }}
            defaultValue={this.props.channel.name}
          />
          <input
            key="selected"
            type="checkbox"
            checked={this.props.channel.enabled}
            onChange={() => this.props.onToggleChannel(this.props.index)}
            style={{ width: "16px", height: "16px" }}
          />
        </div>
        <hr className="channelHR" />
      </div>
    );
  }
}

class ChannelInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      color: "#fff",
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate(oldProps) {
    if (oldProps.selectedChannel !== this.props.selectedChannel) {
      this.setState({
        color: this.props.selectedChannel.channel.channelColor,
      });
    }
  }

  handleChange(color, event) {
    this.props.onColorChannel(this.props.selectedChannel.index, color.hex);
    this.setState({
      color: color.hex,
    });
  }

  render() {
    // TODO: Create custom color picker
    if (this.props.selectedChannel != null) {
      return (
        <div style={{ width: "80%" }}>
          <p>Threshold:</p>
          <Range
            value={this.props.sliderRange}
            onChange={(e) => {
              this.props.sliderChanged(e);
            }}
          />
          <p>Color:</p>
          <SketchPicker color={this.state.color} onChange={this.handleChange} />
        </div>
      );
    } else {
      return <div />;
    }
  }
}

export default class RightPane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      file: this.props.file,
      selectedChannel: null,
      sliderRange: [1, 100],
    };

    this.channelSelected = this.channelSelected.bind(this);
    this.sliderChanged = this.sliderChanged.bind(this);
  }

  channelSelected(channel, index) {
    this.setState({
      selectedChannel: { channel, index },
      sliderRange: channel.threshold,
    });
  }

  sliderChanged(values) {
    this.props.onThreshChannel(this.state.selectedChannel.index, values);
    this.setState({ sliderRange: values });
  }

  componentDidUpdate(prevProps) {
    if (this.props.file !== prevProps.file) {
      this.setState({
        file: this.props.file,
        // Need to differentiate whether an entire different file is loaded
        // so the default selected stuff gets set right
        // selectedChannel: null,
        // sliderRange: [1, 100]
      });
    }
  }

  render() {
    if (this.state.file !== null) {
      return (
        <div className="rightPane">
          <div className="channelList">
            {this.state.file.idfArray.map((channel, index) => (
              <ChannelItem
                key={index}
                channel={channel}
                index={index}
                selectedChannel={this.state.selectedChannel}
                channelSelected={this.channelSelected}
                onNameChannel={this.props.onNameChannel}
                onToggleChannel={this.props.onToggleChannel}
              />
            ))}
          </div>
          <hr className="channelHR" style={{ marginTop: "4px" }} />
          <ChannelInput
            sliderChanged={this.sliderChanged}
            onColorChannel={this.props.onColorChannel}
            selectedChannel={this.state.selectedChannel}
            sliderRange={this.state.sliderRange}
          />
        </div>
      );
    } else {
      return <div />;
    }
  }
}
