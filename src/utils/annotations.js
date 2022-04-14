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

function standardizeColor(str) {
  // https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  var ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = str;
  return ctx.fillStyle;
}

export const Annotation = (type, color, params, name) => {
  return {
    type,
    color,
    params,
    name,
    nucleusDetection: null,
    alpha: 30,
    useNucleusDetection: true,
  };
};

export const Circle = (x, y, r, color, name) => {
  return Annotation(AnnotationTypes.Circle, color, { x, y, r }, name);
};

export const Square = (x, y, w, h, color, name) => {
  return Annotation(AnnotationTypes.Square, color, { x, y, w, h }, name);
};

export const Polygon = (points, color, name) => {
  return Annotation(AnnotationTypes.Polygon, color, points, name);
};

export const getAnnotationFills = (annotations) => {
  let fillStyles = [];

  // Fill the images array with each enabled channel of the idfArray
  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    const nucleusImage = getNucleusDetectionImage(annotation);

    if (nucleusImage && annotation.useNucleusDetection) {
      fillStyles.push(createImageBitmap(nucleusImage));
    } else {
      const hexString = Math.round(annotation.color.rgb.a * 255).toString(16);
      fillStyles.push(annotation.color.hex + hexString);
    }
  }

  return Promise.all(fillStyles);
};

export const getNucleusDetectionImage = (annotation) => {
  if (annotation.nucleusDetection == null) return null;
  const data = annotation.nucleusDetection.detectionArray;
  const intArray = new Uint8ClampedArray(
    annotation.nucleusDetection.width * annotation.nucleusDetection.height * 4
  );

  for (let i = 0, j = 0; i < data.length; i++) {
    const threshVal = data[i] > 0 ? 255 : 255 * annotation.color.a;
    intArray[j++] = annotation.color.r; // R value
    intArray[j++] = annotation.color.g; // G value
    intArray[j++] = annotation.color.b; // B value
    intArray[j++] = threshVal; // A value
  }

  return new ImageData(
    intArray,
    annotation.nucleusDetection.width,
    annotation.nucleusDetection.height
  );
};
