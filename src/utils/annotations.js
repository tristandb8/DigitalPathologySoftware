export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

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

export const defaultColor = () => {
  return {
    hex: "#ff0000",
    rgb: {
      r: 255,
      g: 0,
      b: 0,
      a: 16 / 255,
    },
  };
};

export const Annotation = (type, params, name) => {
  const annotation = {
    type,
    color: defaultColor(),
    params,
    name,
    fill: null,
    useNucleusDetection: true,
    useCytoDetection: false,
  };

  annotation.fill = getHexAlphaColor(annotation, null);
  return annotation;
};

export const Circle = (x, y, r, name) => {
  return Annotation(AnnotationTypes.Circle, { x, y, r }, name);
};

export const Square = (x, y, w, h, name) => {
  return Annotation(AnnotationTypes.Square, { x, y, w, h }, name);
};

export const Polygon = (points, name) => {
  return Annotation(AnnotationTypes.Polygon, points, name);
};

export const getAnnotationFill = (
  annotation,
  nucleusDetection,
  cytoDetection
) => {
  if (annotation.useNucleusDetection && nucleusDetection) {
    const bitmapPromise = createImageBitmap(
      getNucleusDetectionImage(annotation, nucleusDetection, cytoDetection)
    );
    return bitmapPromise;
  } else if (annotation.useCytoDetection && cytoDetection) {
    const bitmapPromise = createImageBitmap(
      getNucleusDetectionImage(annotation, nucleusDetection, cytoDetection)
    );
    return bitmapPromise;
  } else {
    return Promise.resolve(getHexAlphaColor(annotation));
  }
};

export const getHexAlphaColor = (annotation) => {
  let hexAlpha = Math.round(annotation.color.rgb.a * 255).toString(16);
  if (annotation.color.rgb.a < 16 / 255) hexAlpha = "0" + hexAlpha;
  const hexColor = annotation.color.hex + hexAlpha;
  return hexColor;
};

export const getNucleusDetectionImage = (
  annotation,
  nucleusDetection,
  cytoDetection
) => {
  if (nucleusDetection == null) return null;
  const data = nucleusDetection.detectionArray;
  const cytoData = cytoDetection?.detectionArray;

  if (annotation.useCytoDetection && cytoData) {
    const intArray = new Uint8ClampedArray(
      cytoDetection.width * cytoDetection.height * 4
    );
    for (let i = 0, j = 0; i < cytoData.length; i++) {
      const isNucleus = cytoData[i] > 0;
      const index = Math.abs(cytoData[i]) % Object.values(colors).length;
      const colorVal = hexToRgb(Object.values(colors)[index]);

      if (isNucleus) {
        intArray[j++] = annotation.color.rgb.r; // R value
        intArray[j++] = annotation.color.rgb.g; // G value
        intArray[j++] = annotation.color.rgb.b; // B value
        intArray[j++] = annotation.color.rgb.a * 255;
      } else {
        intArray[j++] = colorVal.r; // R value
        intArray[j++] = colorVal.g; // G value
        intArray[j++] = colorVal.b; // B value
        intArray[j++] = (1 - annotation.color.rgb.a) * 255;
      }
    }
    return new ImageData(intArray, cytoDetection.width, cytoDetection.height);
  } else {
    const intArray = new Uint8ClampedArray(
      nucleusDetection.width * nucleusDetection.height * 4
    );
    for (let i = 0, j = 0; i < data.length; i++) {
      const isNucleus = data[i] > 0;
      const index = Math.abs(data[i]) % Object.values(colors).length;
      const colorVal = hexToRgb(Object.values(colors)[index]);

      if (isNucleus) {
        intArray[j++] = colorVal.r; // R value
        intArray[j++] = colorVal.g; // G value
        intArray[j++] = colorVal.b; // B value
        intArray[j++] = (1 - annotation.color.rgb.a) * 255;
      } else {
        intArray[j++] = annotation.color.rgb.r; // R value
        intArray[j++] = annotation.color.rgb.g; // G value
        intArray[j++] = annotation.color.rgb.b; // B value
        intArray[j++] = annotation.color.rgb.a * 255;
      }
    }
    return new ImageData(
      intArray,
      nucleusDetection.width,
      nucleusDetection.height
    );
  }
};
