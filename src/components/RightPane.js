import React from "react";
import "rc-slider/assets/index.css";
import "../App.css";
import { Range } from "rc-slider";
import { SketchPicker } from "react-color";

class ChannelItem extends React.Component {
  render() {
    // const selected =
    //   this.props.selectedChannel !== null &&
    //   this.props.selectedChannel.index === this.props.index;
    const selected = this.props.selectedChannel?.index === this.props.index;
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
              this.props.renameChannel(this.props.index, e.target.value);
            }}
            defaultValue={this.props.channelName}
          />
          <input
            key="selected"
            type="checkbox"
            checked={this.props.channel.enabled}
            onChange={() =>
              this.props.onChannelChange(
                this.props.index,
                "enabled",
                !this.props.channel.enabled
              )
            }
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
  }

  componentDidUpdate(oldProps) {
    if (oldProps.selectedChannel !== this.props.selectedChannel) {
      this.setState({
        color: this.props.selectedChannel?.channel.channelColor || "#fff",
      });
    }
  }

  handleChange = (color, event) => {
    this.props.onChannelChange(
      this.props.selectedChannel.index,
      "channelColor",
      color.hex
    );
    this.setState({
      color: color.hex,
    });
  };

  render() {
    // TODO: Create custom color picker
    if (this.props.selectedChannel != null) {
      return (
        <div style={{ width: "80%" }}>
          <p>Threshold:</p>
          <Range
            value={[this.props.sliderRange.min, this.props.sliderRange.max]}
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
      selectedChannel: null,
      sliderRange: { min: 1, max: 100 },
    };
  }

  channelSelected = (channel, index) => {
    this.setState({
      selectedChannel: { channel, index },
      sliderRange: channel.threshold,
    });
  };

  sliderChanged = (values) => {
    this.props.onChannelChange(this.state.selectedChannel.index, "threshold", {
      min: values[0],
      max: values[1],
    });
    this.setState({ sliderRange: { min: values[0], max: values[1] } });
  };

  render() {
    const file = this.props.project.files.get(this.props.project.activeFile);
    if (file != null) {
      return (
        <div className="rightPane">
          <div className="channelList">
            {file.imageData.idfArray.map((channel, index) => (
              <ChannelItem
                key={index}
                channel={channel}
                index={index}
                channelName={file.channelNames[index]}
                selectedChannel={this.state.selectedChannel}
                channelSelected={this.channelSelected}
                onChannelChange={this.props.onChannelChange}
                renameChannel={this.props.renameChannel}
              />
            ))}
          </div>
          <hr className="channelHR" style={{ marginTop: "4px" }} />
          <ChannelInput
            sliderChanged={this.sliderChanged}
            onChannelChange={this.props.onChannelChange}
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
