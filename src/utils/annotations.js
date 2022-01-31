export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

export const Annotation = (type, color, params) => {
  return { type, color, params };
};

export const Circle = (x, y, r, color) => {
  return Annotation(AnnotationTypes.Circle, color, { x, y, r });
};

export const Square = (x, y, w, h, color) => {
  return Annotation(AnnotationTypes.Square, color, { x, y, w, h });
};

export const Polygon = (points, color) => {
  return Annotation(AnnotationTypes.Polygon, color, { points });
};
