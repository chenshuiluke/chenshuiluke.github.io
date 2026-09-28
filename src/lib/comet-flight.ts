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
    hue: [0, 20, 35, 180, 265, 320][Math.floor(random() * 6)],
  };
}

export function sampleCometFlight(flight: CometFlight, t: number) {
  const { start: a, control: b, end: c } = flight;
  const point = (u: number) => ({
    x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * b.x + u * u * c.x,
    y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * b.y + u * u * c.y,
  });
  const position = point(t);
  const dx = 2 * ((1 - t) * (b.x - a.x) + t * (c.x - b.x));
  const dy = 2 * ((1 - t) * (b.y - a.y) + t * (c.y - b.y));
  return {
    ...position,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

const hash = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Each ember is born at a past head position. Its velocity never follows later turns.
export function cometEmbers(flight: CometFlight, seconds: number, scale = 1) {
  const particles = [];
  const latest = Math.floor(seconds * 240);
  for (let serial = Math.max(0, latest - 312); serial <= latest; serial++) {
    const birth = serial / 240;
    if (birth > flight.duration) continue;
    const seed = serial + flight.hue * 13;
    const spark = hash(seed + 2) > 0.78;
    const life = spark
      ? 0.65 + hash(seed + 1) * 0.65
      : 0.22 + hash(seed + 1) * 0.55;
    const age = seconds - birth;
    if (age < 0 || age >= life) continue;
    const pose = sampleCometFlight(flight, birth / flight.duration);
    const angle = (pose.angle * Math.PI) / 180;
    const lateral = (hash(seed + 3) - 0.5) * (spark ? 110 : 55);
    const backward = 14 + age * (20 + hash(seed + 4) * 55);
    const spread = (hash(seed + 5) - 0.5) * 20 + lateral * age;
    const heat = 1 - age / life;
    particles.push({
      serial,
      x:
        pose.x -
        Math.cos(angle) * backward * scale -
        Math.sin(angle) * spread * scale,
      y:
        pose.y -
        Math.sin(angle) * backward * scale +
        Math.cos(angle) * spread * scale,
      size: spark
        ? Math.max(1, 2 * scale)
        : Math.max(1, (8 + hash(seed + 6) * 10) * heat * scale),
      alpha: spark ? heat ** 1.4 : heat * 0.65,
      heat,
      spark,
    });
  }
  return particles;
}

export function emberColor(hue: number, heat: number) {
  return `hsl(${hue + heat * 35} 100% ${42 + heat ** 3 * 48}%)`;
}

export function drawCometFire(
  context: CanvasRenderingContext2D,
  flight: CometFlight,
  seconds: number,
  scale: number,
) {
  context.globalCompositeOperation = "lighter";
  for (const ember of cometEmbers(flight, seconds, scale)) {
    context.globalAlpha = ember.alpha;
    context.fillStyle = emberColor(flight.hue, ember.heat);
    const size = Math.max(1, Math.round(ember.size));
    context.fillRect(
      Math.round(ember.x - size / 2),
      Math.round(ember.y - size / 2),
      size,
      size,
    );
  }
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
}
