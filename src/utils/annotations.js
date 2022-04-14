export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

export const Annotation = (type, color, params, name) => {
  return {
    type,
    color,
    params,
    name,
    nucleusDetection: null,
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
    annotation.nucleusDetection.width,
    annotation.nucleusDetection.height
  );
};
