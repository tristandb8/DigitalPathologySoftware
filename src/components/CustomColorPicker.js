import React from "react";
import { CustomPicker } from "react-color";
// import { SketchPicker } from "react-color";
var {
  Hue,
  Saturation,
  EditableInput,
} = require("react-color/lib/components/common");

var inputStyles = {
  input: {
    border: "none",
  },
  label: {
    fontSize: "12px",
    color: "#999",
  },
};

class MyColorPicker extends React.Component {
  handleChange = (color, event) => {
    color = {
      hex: "#333",
      rgb: {
        r: 51,
        g: 51,
        b: 51,
        a: 1,
      },
      hsl: {
        h: 0,
        s: 0,
        l: 0.2,
        a: 1,
      },
    };
  };

  render() {
    console.log(this.props);
    return (
      <div>
        <EditableInput
          style={inputStyles}
          label="Hex"
          value={this.props.hex}
          onChange={this.props.onChange}
        />
        <EditableInput
          style={inputStyles}
          label="R"
          value={this.props.rgb.r}
          onChange={(e) => {
            console.log(e);
          }}
        />
        <EditableInput
          style={inputStyles}
          label="G"
          value={this.props.rgb.g}
          onChange={(e) => {
            console.log(e);
          }}
        />
        <EditableInput
          style={inputStyles}
          label="B"
          value={this.props.rgb.b}
          onChange={(e) => {
            console.log(e);
          }}
        />
        <div style={{ width: "100px", height: "10px", position: "relative" }}>
          <Hue
            {...this.props}
            onChange={this.props.onChange}
            direction={"horizontal" || "vertical"}
          />
        </div>
        <div style={{ width: "100px", height: "100px", position: "relative" }}>
          <Saturation {...this.props} onChange={this.props.onChange} />
        </div>
      </div>
    );
  }
}

export default CustomPicker(MyColorPicker);
