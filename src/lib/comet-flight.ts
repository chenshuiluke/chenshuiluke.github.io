import type { GravityBody } from "./gravity";
type TrailSample = { x: number; y: number; angle: number; time: number };
export type CometFlight = {
  body: GravityBody;
  trail: TrailSample[];
  age: number;
  duration: number;
  hue: number;
};

export function createCometFlight(
  width: number,
  height: number,
  random = Math.random,
  scroll = 0,
): CometFlight {
  const edge = Math.floor(random() * 4);
  const position = 0.1 + random() * 0.8;
  const x = edge === 1 ? width + 160 : edge === 3 ? -160 : width * position;
  const y = scroll + (edge === 0 ? -160 : edge === 2 ? height + 160 : height * position);
  const dx = width * (0.15 + random() * 0.7) - x;
  const dy = scroll + height * (0.15 + random() * 0.7) - y;
  const speed = 150 + random() * 130;
  const length = Math.hypot(dx, dy);
  const body = { x, y, vx: dx / length * speed, vy: dy / length * speed, mass: 0.15 };
  return {
    body,
    trail: [{ x, y, angle: Math.atan2(dy, dx) * 180 / Math.PI, time: 0 }],
    age: 0,
    duration: Infinity,
    hue: [0, 20, 35, 180, 265, 320][Math.floor(random() * 6)],
  };
}

export function recordCometTrail(flight: CometFlight) {
  const { x, y, vx, vy } = flight.body;
  flight.trail.push({ x, y, angle: Math.atan2(vy, vx) * 180 / Math.PI, time: flight.age });
  while (flight.trail.length > 2 && flight.trail[1].time < flight.age - 1.4)
    flight.trail.shift();
}

export function sampleCometFlight(flight: CometFlight, time: number) {
  const samples = flight.trail;
  // Uniform physics ticks: direct lookup instead of searching the history per ember.
  const step = samples.length > 1 ? samples[1].time - samples[0].time : 1;
  const index = Math.max(0, Math.min(samples.length - 1, Math.floor((time - samples[0].time) / step)));
  const a = samples[index], b = samples[Math.min(index + 1, samples.length - 1)];
  const t = a === b ? 0 : Math.max(0, Math.min(1, (time - a.time) / (b.time - a.time)));
  const angle = ((b.angle - a.angle + 540) % 360) - 180;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: a.angle + angle * t,
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
    const pose = sampleCometFlight(flight, birth);
    const angle = (pose.angle * Math.PI) / 180;
    const lateral = (hash(seed + 3) - 0.5) * (spark ? 110 : 55);
    // Start beneath the rear of the masked nucleus so the fire joins without a seam.
    const backward = 8 + age * (20 + hash(seed + 4) * 55);
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
