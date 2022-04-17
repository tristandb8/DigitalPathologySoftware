export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

export const Annotation = (type, params, name) => {
  const color = {
    hex: "#ff0000",
    rgb: {
      r: 255,
      g: 0,
      b: 0,
      a: 16 / 255,
    },
  };

  const annotation = {
    type,
    color,
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

export const getAnnotationFill = (annotation, nucleusDetection) => {
  if (!annotation.useNucleusDetection || !nucleusDetection) {
    return Promise.resolve(getHexAlphaColor(annotation));
  }
  const bitmapPromise = createImageBitmap(
    getNucleusDetectionImage(annotation, nucleusDetection)
  );
  return bitmapPromise;
};

export const getHexAlphaColor = (annotation) => {
  let hexAlpha = Math.round(annotation.color.rgb.a * 255).toString(16);
  if (annotation.color.rgb.a < 16 / 255) hexAlpha = "0" + hexAlpha;
  const hexColor = annotation.color.hex + hexAlpha;
  return hexColor;
};

export const getNucleusDetectionImage = (annotation, nucleusDetection) => {
  if (nucleusDetection == null) return null;
  const data = nucleusDetection.detectionArray;
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
};
