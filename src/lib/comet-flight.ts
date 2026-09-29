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
  planets: GravityBody[] = [],
): CometFlight {
  const edge = Math.floor(random() * 4);
  const position = 0.1 + random() * 0.8;
  const x = edge === 1 ? width + 48 : edge === 3 ? -48 : width * position;
  const y = scroll + (edge === 0 ? -48 : edge === 2 ? height + 48 : height * position);
  const nearby = planets.filter((p) => p.mass > 30 && p.x > 0 && p.x < width && p.y > scroll && p.y < scroll + height);
  const target = nearby.length ? nearby[Math.floor(random() * nearby.length)] : null;
  // Aim the initial velocity near a planet; gravity alone determines the subsequent arc.
  const dx = (target ? target.x + (random() - 0.5) * 180 : width * (0.15 + random() * 0.7)) - x;
  const dy = (target ? target.y + (random() - 0.5) * 180 : scroll + height * (0.15 + random() * 0.7)) - y;
  const speed = 90 + random() * 60;
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

function birthEmber(flight: CometFlight, serial: number) {
  const birth = serial / 240;
  const seed = serial + flight.hue * 13;
  const spark = hash(seed + 2) > 0.78;
  const life = spark ? 0.65 + hash(seed + 1) * 0.65 : 0.22 + hash(seed + 1) * 0.55;
  const pose = sampleCometFlight(flight, birth);
  const angle = pose.angle * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const lateral = (hash(seed + 3) - 0.5) * (spark ? 110 : 55);
  const backward = 20 + hash(seed + 4) * 55;
  const spread = (hash(seed + 5) - 0.5) * 20;
  return {
    birth, spark, life, x: pose.x, y: pose.y,
    offsetX: -cos * 8 - sin * spread, offsetY: -sin * 8 + cos * spread,
    vx: -cos * backward - sin * lateral, vy: -sin * backward + cos * lateral,
    size: 8 + hash(seed + 6) * 10,
  };
}
const emberCaches = new WeakMap<CometFlight, {
  latest: number;
  time: number;
  embers: (ReturnType<typeof birthEmber> & { serial: number })[];
}>();

// Each ember is born at a past head position. Its velocity never follows later turns.
export function cometEmbers(flight: CometFlight, seconds: number, scale = 1) {
  const particles = [];
  const latest = Math.floor(seconds * 240);
  let cache = emberCaches.get(flight);
  if (!cache || seconds < cache.time) {
    cache = { latest: -1, time: seconds, embers: [] };
    emberCaches.set(flight, cache);
  }
  // Birth each particle once, then retain only live particles. Long time jumps
  // skip expired births; rewinding reconstructs the same deterministic embers.
  for (let serial = Math.max(0, latest - 312, cache.latest + 1); serial <= latest; serial++) {
    if (serial / 240 <= flight.duration)
      cache.embers.push({ ...birthEmber(flight, serial), serial });
  }
  cache.latest = latest;
  cache.time = seconds;
  let alive = 0;
  for (const ember of cache.embers) {
    const { serial, birth } = ember;
    const { spark, life } = ember;
    const age = seconds - birth;
    if (age < 0 || age >= life) continue;
    cache.embers[alive++] = ember;
    const heat = 1 - age / life;
    particles.push({
      serial,
      x: ember.x + (ember.offsetX + ember.vx * age) * scale,
      y: ember.y + (ember.offsetY + ember.vy * age) * scale,
      size: spark
        ? Math.max(1, 2 * scale)
        : Math.max(1, ember.size * heat * scale),
      alpha: spark ? heat ** 1.4 : heat * 0.65,
      heat,
      spark,
    });
  }
  cache.embers.length = alive;
  return particles;
}

export function emberColor(hue: number, heat: number) {
  return `hsl(${hue + heat * 35} 100% ${42 + heat ** 3 * 48}%)`;
}
const palettes = new Map<number, string[]>();

export function drawCometFire(
  context: CanvasRenderingContext2D,
  flight: CometFlight,
  seconds: number,
  scale: number,
  viewport?: { top: number; bottom: number; left: number; right: number },
) {
  // Keep simulating offscreen bodies, but don't spend canvas work on invisible fire.
  if (viewport && !flight.trail.some((p) => p.x > viewport.left - 200 && p.x < viewport.right + 200 && p.y > viewport.top - 200 && p.y < viewport.bottom + 200)) return;
  let palette = palettes.get(flight.hue);
  if (!palette) {
    palette = Array.from({ length: 256 }, (_, i) => {
      const heat = (i % 128) / 127;
      const alpha = i < 128 ? heat * .65 : heat ** 1.4;
      return emberColor(flight.hue, Math.floor(heat * 63) / 63).replace(")", ` / ${alpha})`);
    });
    palettes.set(flight.hue, palette);
  }
  // Cached colors include opacity; one native rectangle draw per particle.
  context.globalAlpha = 1;
  context.globalCompositeOperation = "lighter";
  for (const ember of cometEmbers(flight, seconds, scale)) {
    if (viewport && (ember.x < viewport.left - ember.size || ember.x > viewport.right + ember.size || ember.y < viewport.top - ember.size || ember.y > viewport.bottom + ember.size)) continue;
    const size = Math.max(1, Math.round(ember.size));
    context.fillStyle = palette[(ember.spark ? 128 : 0) + Math.min(127, Math.floor(ember.heat * 127))];
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
