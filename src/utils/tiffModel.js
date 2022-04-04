import { AnnotationTypes } from "../utils/annotations";
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
  yellowgreen: "#9acd32",
  gray: "#808080",
  paleturquoise: "#afeeee",
  mediumslateblue: "#7b68ee",
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
    idfArray[i].enabled = i === idfArray.length - 1;
    idfArray[i].max = getMax(idfArray[i].data);

    // todo: calculate threshold value automatically using histogram
    idfArray[i].threshold = { min: 5, max: 25 };
  }

  const width = idfArray[0].width;
  const height = idfArray[0].height;
  const channels = idfArray.length;

  return {
    type: "tiff",
    idfArray,
    width,
    height,
    channels,
  };
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

export const sliceImageFromAnnotation = (t, annotation) => {
  let roi = { x: 0, y: 0, w: 0, h: 0 };
  if (annotation) {
    switch (annotation.type) {
      case AnnotationTypes.Circle:
        roi = {
          x: annotation.params.x - annotation.params.r,
          y: annotation.params.y - annotation.params.r,
          w: annotation.params.r * 2,
          h: annotation.params.r * 2,
        };
        break;
      case AnnotationTypes.Square:
        roi = annotation.params;
        break;
      case AnnotationTypes.Polygon:
        let minX = Number.MAX_SAFE_INTEGER,
          minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER,
          maxY = Number.MIN_SAFE_INTEGER;

        for (const coord of annotation.params) {
          minX = Math.min(minX, coord.x);
          minY = Math.min(minY, coord.y);
          maxX = Math.max(maxX, coord.x);
          maxY = Math.max(maxY, coord.y);
        }

        roi = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        break;
      default:
        console.error(`Unknown annotation type ${annotation.type}`);
        break;
    }
  } else {
    // If no annotation, just use whole image
    roi = { x: 0, y: 0, w: t.width, h: t.height };
  }

  roi = {
    x: Math.trunc(roi.x),
    y: Math.trunc(roi.y),
    w: Math.trunc(roi.w),
    h: Math.trunc(roi.h),
  };

  const intArray = new Uint8ClampedArray(roi.w * roi.h);
  const channel = t.idfArray[t.cellDetectChannel];
  const data = channel.data;

  for (let row = 0; row < roi.h; row++) {
    for (let col = 0; col < roi.w; col++) {
      intArray[row * roi.w + col] =
        data[(roi.y + row) * t.width + (roi.x + col)];
    }
  }

  return { intArray, width: roi.w, height: roi.h };
};

export const getChannelImageData = (t, index) => {
  const channel = t.idfArray[index];
  const data = channel.data;
  const intArray = new Uint8ClampedArray(t.width * t.height * 4);
  const color = hexToRgb(channel.channelColor);

  for (let i = 0, j = 0; i < data.length; i++) {
    const lowThresh = (channel.max * channel.threshold.min) / 100;
    const highThresh = (channel.max * channel.threshold.max) / 100;
    const threshVal = (data[i] - lowThresh) / highThresh;

    intArray[j++] = threshVal * color.r; // R value
    intArray[j++] = threshVal * color.g; // G value
    intArray[j++] = threshVal * color.b; // B value
    intArray[j++] = threshVal > 0 ? 255 : 0; // A value
  }

  return new ImageData(intArray, t.width, t.height);
};
