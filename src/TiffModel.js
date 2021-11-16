const tiff = require('tiff')

function hexToRgb(hex) {
  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

const colors = {
  darkorchid: '#9932cc', orangered: '#ff4500', darkorange: '#ff8c00',
  gold: '#ffd700', yellow: '#ffff00', mediumvioletred: '#c71585',
  mediumblue: '#0000cd', lime: '#00ff00', mediumspringgreen: '#00fa9a',
  crimson: '#dc143c', aqua: '#00ffff', sandybrown: '#f4a460',
  blue: '#0000ff', purple3: '#a020f0', lightcoral: '#f08080',
  greenyellow: '#adff2f', tomato: '#ff6347', fuchsia: '#ff00ff',
  cornflower: '#6495ed', plum: '#dda0dd', lightgreen: '#90ee90',
  mediumslateblue: '#7b68ee', paleturquoise: '#afeeee', violet: '#ee82ee',
  lightskyblue: '#87cefa', aquamarine: '#7fffd4', navajowhite: '#ffdead',
  hotpink: '#ff69b4', lightpink: '#ffb6c1',
  mediumseagreen: '#3cb371', darkgoldenrod: '#b8860b', darkkhaki: '#bdb76b',
  steelblue: '#4682b4', chocolate: '#d2691e', yellowgreen: '#9acd32',
  lightseagreen: '#20b2aa', indigo: '#4b0082', limegreen: '#32cd32',
  darkseagreen: '#8fbc8f', darkmagenta: '#8b008b', maroon3: '#b03060',
  darkolivegreen: '#556b2f', sienna: '#a0522d', maroon2: '#7f0000',
  darkgreen: '#006400', olive: '#808000', darkslateblue: '#483d8b',
  gray:'$808080', silver: '#c0c0c0', darkslategray: '#2f4f4f',
}

export class TiffModel {
  constructor(fileData) {
    this.idfArray = tiff.decode(fileData)
    for (let i = 0; i < this.idfArray.length; i++) {
      this.idfArray[i].channelColor = hexToRgb(Object.values(colors)[i])
      this.idfArray[i].enabled = true
    }

    this.width = this.idfArray[0].width
    this.height = this.idfArray[0].height
    this.channels = this.idfArray.length
  }

  getBitmap() {
    let images = []

    for (let imageIndex = 0; imageIndex < this.idfArray.length; imageIndex++) {
      if (this.idfArray[imageIndex].enabled) {
        const image = this.getChannelImageData(imageIndex)
        images.push(createImageBitmap(image))
      }
    }

    return Promise.all(images)
  }

  getChannelImageData(channel) {
    const data = this.idfArray[channel].data
    const intArray = new Uint8ClampedArray(this.width * this.height * 4)
    const color = this.idfArray[channel].channelColor

    let j = 0
    for (let i = 0; i < data.length; i++) {
      intArray[j++] = data[i] * color.r // R value
      intArray[j++] = data[i] * color.g // G value
      intArray[j++] = data[i] * color.b // B value
      intArray[j++] = data[i] > 0 ? 255 : 0 // A value
    }
    
    return new ImageData(intArray, this.width, this.height)
  }

  getChannelColor(channel) {
    return this.idfArray[channel].channelColor
  }

  setChannelColor(channel, color) {
    this.idfArray[channel].channelColor = color
  }

  getChannelVisibility(channel) {
    return this.idfArray[channel].enabled
  }

  setChannelVisibility(channel, visibility) {
    console.log(visibility)
    this.idfArray[channel].enabled = visibility
  }
}
