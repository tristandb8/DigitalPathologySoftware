export const AnnotationTypes = {
  Square: "Square",
  Circle: "Circle",
  Polygon: "Polygon",
};

export const Annotation = (type, color, params, name) => {
  return { type, color, params, name, selected: false };
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
