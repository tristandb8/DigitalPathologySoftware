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

export const angle = (pointA, pointB) => {
  const euclideanDistance = dist(pointA, pointB);

  if (!euclideanDistance) {
    return 0;
  }

  return Math.asin((pointB.y - pointA.y) / euclideanDistance);
};
