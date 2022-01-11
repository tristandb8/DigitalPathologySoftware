const tiff = require("tiff");

function hexToRgb(hex) {
  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// https://stackoverflow.com/questions/42623071/maximum-call-stack-size-exceeded-with-math-min-and-math-max
function getMax(arr) {
  return arr.reduce((max, v) => (max >= v ? max : v), -Infinity);
}

const colors = {
  fuchsia: "#ff00ff",
  lightgreen: "#90ee90",
  lightcoral: "#f08080",
  darkmagenta: "#8b008b",
  hotpink: "#ff69b4",
  mediumseagreen: "#3cb371",
  aqua: "#00ffff",
  silver: "#c0c0c0",
  darkgoldenrod: "#b8860b",
  darkgreen: "#006400",
  steelblue: "#4682b4",
  greenyellow: "#adff2f",
  sienna: "#a0522d",
  maroon2: "#7f0000",
  maroon3: "#b03060",
  darkkhaki: "#bdb76b",
  darkseagreen: "#8fbc8f",
  lime: "#00ff00",
  lightpink: "#ffb6c1",
  sandybrown: "#f4a460",
  cornflower: "#6495ed",
  purple3: "#a020f0",
  orangered: "#ff4500",
  crimson: "#dc143c",
  gold: "#ffd700",
  limegreen: "#32cd32",
  blue: "#0000ff",
  violet: "#ee82ee",
  chocolate: "#d2691e",
  navajowhite: "#ffdead",
  lightseagreen: "#20b2aa",
  darkorchid: "#9932cc",
  darkorange: "#ff8c00",
  gray: "#808080",
  paleturquoise: "#afeeee",
  mediumslateblue: "#7b68ee",
  yellowgreen: "#9acd32",
  olive: "#808000",
  plum: "#dda0dd",
  tomato: "#ff6347",
  darkslategray: "#2f4f4f",
  mediumblue: "#0000cd",
  aquamarine: "#7fffd4",
  indigo: "#4b0082",
  yellow: "#ffff00",
  darkslateblue: "#483d8b",
  lightskyblue: "#87cefa",
  mediumvioletred: "#c71585",
  darkolivegreen: "#556b2f",
  mediumspringgreen: "#00fa9a",
};

export const tiffImage = (fileData) => {
  let idfArray = tiff.decode(fileData);
  for (let i = 0; i < idfArray.length; i++) {
    idfArray[i].channelColor = Object.values(colors)[i];
    idfArray[i].enabled = i === 0;
    idfArray[i].name = `Layer ${i + 1}`;
    idfArray[i].max = getMax(idfArray[i].data);

    // todo: calculate threshold value automatically using histogram
    idfArray[i].threshold = [5, 25];
  }

  const width = idfArray[0].width;
  const height = idfArray[0].height;
  const channels = idfArray.length;

  return { idfArray, width, height, channels };
};

export const getBitmap = (t) => {
  let images = [];

  // Fill the images array with each enabled channel of the idfArray
  for (let imageIndex = 0; imageIndex < t.idfArray.length; imageIndex++) {
    if (t.idfArray[imageIndex].enabled) {
      const image = getChannelImageData(t, imageIndex);
      images.push(createImageBitmap(image));
    }
  }

  // createImageBitmap returns a future object, so we make a promise to return
  // all the images
  return Promise.all(images);
};

export const getChannelImageData = (t, index) => {
  const channel = t.idfArray[index];
  const data = channel.data;
  const intArray = new Uint8ClampedArray(t.width * t.height * 4);
  const color = hexToRgb(channel.channelColor);

  for (let i = 0, j = 0; i < data.length; i++) {
    const lowThresh = (channel.max * channel.threshold[0]) / 100;
    const highThresh = (channel.max * channel.threshold[1]) / 100;
    const threshVal = (data[i] - lowThresh) / highThresh;

    intArray[j++] = threshVal * color.r; // R value
    intArray[j++] = threshVal * color.g; // G value
    intArray[j++] = threshVal * color.b; // B value
    intArray[j++] = threshVal > 0 ? 255 : 0; // A value
  }

  return new ImageData(intArray, t.width, t.height);
};
