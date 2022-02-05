export const Point = (x, y) => {
  return { x, y };
};

export const ORIGIN = () => {
  return Point(0, 0);
};

export const dist = (pointA, pointB) => {
  return Math.sqrt(
    (pointA.x - pointB.x) * (pointA.x - pointB.x) +
      (pointA.y - pointB.y) * (pointA.y - pointB.y)
  );
};

export const diff = (pointA, pointB) => {
  return Point(pointB.x - pointA.x, pointB.y - pointA.y);
};

export const sum = (pointA, pointB) => {
  return Point(pointA.x + pointB.x, pointA.y + pointB.y);
};

export const scale = (pointA, s) => {
  return Point(pointA.x * s, pointA.y * s);
};

export const norm = (pointA, pointB) => {
  return Point(-(pointB.y - pointA.y), pointB.x - pointA.x);
};

export const mag = (pointA) => {
  return Math.sqrt(pointA.x * pointA.x + pointA.y * pointA.y);
};

export const normalize = (pointA) => {
  const m = mag(pointA);
  if (m === 0) return pointA;
  return scale(pointA, 1 / m);
};

export const angle = (pointA) => {
  return Math.atan2(pointA.y, pointA.x);
};

export const angleBetween = (pointA, pointB) => {
  const euclideanDistance = dist(pointA, pointB);

  if (!euclideanDistance) {
    return 0;
  }

  return Math.asin((pointB.y - pointA.y) / euclideanDistance);
};
