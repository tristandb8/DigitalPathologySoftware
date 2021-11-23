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

// https://stackoverflow.com/questions/42623071/maximum-call-stack-size-exceeded-with-math-min-and-math-max
function getMax(arr) {
  return arr.reduce((max, v) => max >= v ? max : v, -Infinity);
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

export const tiffImage = (fileData) => {
  let idfArray = tiff.decode(fileData)
  for (let i = 0; i < idfArray.length; i++) {
    idfArray[i].channelColor = Object.values(colors)[i]
    idfArray[i].enabled = i === 0 ? true : false
    idfArray[i].name = `Layer ${i+1}`
    idfArray[i].max = getMax(idfArray[i].data)

    // todo: calculate threshold value automatically using histogram
    idfArray[i].threshold = [1, 96]
  }

  const width = idfArray[0].width
  const height = idfArray[0].height
  const channels = idfArray.length

  return {idfArray, width, height, channels}
}

export const getBitmap = (t) => {
  let images = []
  
  // Fill the images array with each enabled channel of the idfArray
  for (let imageIndex = 0; imageIndex < t.idfArray.length; imageIndex++) {
    if (t.idfArray[imageIndex].enabled) {
      const image = getChannelImageData(t, imageIndex)
      images.push(createImageBitmap(image))
    }
  }
  
  // createImageBitmap returns a future object, so we make a promise to return
  // all the images
  return Promise.all(images)
}

export const getChannelImageData = (t, index) => {
  const channel = t.idfArray[index]
  const data = channel.data
  const intArray = new Uint8ClampedArray(t.width * t.height * 4)
  const color = hexToRgb(channel.channelColor)

  let j = 0
  for (let i = 0; i < data.length; i++) {
    const lowThresh = channel.max * channel.threshold[0] / 100
    const highThresh = channel.max * channel.threshold[1] / 100
    const threshVal = (data[i] <= highThresh && data[i] >= lowThresh) ? (data[i] - lowThresh) / highThresh: 0
    intArray[j++] = threshVal * color.r // R value
    intArray[j++] = threshVal * color.g // G value
    intArray[j++] = threshVal * color.b // B value
    intArray[j++] = threshVal > 0 ? 255 : 0 // A value
  }
  
  return new ImageData(intArray, t.width, t.height)
}
