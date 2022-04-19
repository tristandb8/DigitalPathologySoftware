export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

// https://stackoverflow.com/questions/42623071/maximum-call-stack-size-exceeded-with-math-min-and-math-max
function getMax(arr) {
  return arr.reduce((max, v) => (max >= v ? max : v), -Infinity);
}

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
  if (!annotation.useNucleusDetection || !nucleusDetection) {
    return Promise.resolve(getHexAlphaColor(annotation));
  }
  const bitmapPromise = createImageBitmap(
    getNucleusDetectionImage(annotation, nucleusDetection, cytoDetection)
  );
  return bitmapPromise;
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

  if (cytoData) {
    const intArray = new Uint8ClampedArray(1000 * 1000 * 4);
    for (let i = 0, j = 0; i < cytoData.length; i++) {
      const threshVal = cytoData[i] > 0 ? cytoData[i] : 0;
      intArray[j++] = threshVal; // R value
      intArray[j++] = threshVal; // G value
      intArray[j++] = threshVal; // B value
      intArray[j++] = 255; // A value
    }
    return new ImageData(intArray, 1000, 1000);
  } else {
    const intArray = new Uint8ClampedArray(
      nucleusDetection.width * nucleusDetection.height * 4
    );
    for (let i = 0, j = 0; i < data.length; i++) {
      const threshVal =
        data[i] > 0
          ? 255 * (1 - annotation.color.rgb.a)
          : 255 * annotation.color.rgb.a;
      intArray[j++] = annotation.color.rgb.r; // R value
      intArray[j++] = annotation.color.rgb.g; // G value
      intArray[j++] = annotation.color.rgb.b; // B value
      intArray[j++] = threshVal; // A value
    }
    return new ImageData(
      intArray,
      nucleusDetection.width,
      nucleusDetection.height
    );
  }
};
