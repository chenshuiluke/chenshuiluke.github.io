type Point = { x: number; y: number };
export type CometFlight = {
  start: Point;
  control: Point;
  end: Point;
  duration: number;
  hue: number;
};

export function createCometFlight(
  width: number,
  height: number,
  random = Math.random,
): CometFlight {
  const edge = Math.floor(random() * 4);
  const endEdge = (edge + 1 + Math.floor(random() * 3)) % 4;
  const point = (side: number): Point => {
    const position = 0.1 + random() * 0.8;
    if (side === 0) return { x: width * position, y: -300 };
    if (side === 1) return { x: width + 300, y: height * position };
    if (side === 2) return { x: width * position, y: height + 300 };
    return { x: -300, y: height * position };
  };
  return {
    start: point(edge),
    end: point(endEdge),
    control: {
      x: width * (0.15 + random() * 0.7),
      y: height * (0.15 + random() * 0.7),
    },
    duration: 4.5 + random() * 2.5,
    hue: Math.floor(random() * 360),
  };
}

export function sampleCometFlight(
  flight: CometFlight,
  t: number,
  spriteWidth = 240,
) {
  const { start: a, control: b, end: c } = flight;
  const point = (u: number) => ({
    x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * b.x + u * u * c.x,
    y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * b.y + u * u * c.y,
  });
  const position = point(t);
  const dx = 2 * ((1 - t) * (b.x - a.x) + t * (c.x - b.x));
  const dy = 2 * ((1 - t) * (b.y - a.y) + t * (c.y - b.y));
  const speed = Math.hypot(dx, dy) || 1;
  const past = point(
    Math.max(0, t - Math.min(0.2, (spriteWidth * 0.65) / speed)),
  );
  // Project the recent path onto the head's normal: the tail follows the turn.
  const bend =
    ((((past.y - position.y) * dx - (past.x - position.x) * dy) / speed) *
      192) /
    spriteWidth;
  return {
    ...position,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    bend: Math.max(-8, Math.min(8, bend)),
  };
}
