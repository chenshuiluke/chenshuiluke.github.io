import type { GravityBody } from "./gravity";
type TrailSample = { x: number; y: number; angle: number; time: number };
export type CometFlight = {
  body: GravityBody;
  trail: TrailSample[];
  age: number;
  duration: number;
  hue: number;
  variant: number;
};

export const COMET_VARIANTS = 5;
export const COMET_HEAD_SIZE = 40;

// Small, tail-free nuclei: shared warm highlights keep hue shifts and fire cohesive.
// Generate once per variant, never per animation frame.
export function paintCometHead(pixels: Uint8ClampedArray, variant: number) {
  pixels.fill(0);
  const palette = [
    [29, 22, 40], [55, 35, 48], [85, 47, 48], [121, 65, 49],
    [161, 85, 48], [201, 114, 55], [235, 148, 67], [255, 185, 87],
    [255, 216, 125], [255, 238, 181], [255, 251, 225],
  ];
  const noise = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + variant * 73.3) * 43758.5453;
    return n - Math.floor(n);
  };
  const craters = [[-.3, -.25, .29], [.28, .24, .23], [-.3, .4, .16], [.35, -.4, .13]];
  for (let y = 0; y < COMET_HEAD_SIZE; y++) for (let x = 0; x < COMET_HEAD_SIZE; x++) {
    const u = (x - 19.5) / 20, v = (y - 19.5) / 20;
    const angle = Math.atan2(v, u);
    const rough = .025 * Math.sin(angle * 11 + variant) + .035 * Math.sin(angle * 5);
    let edge: number;
    switch (variant) {
      case 1: edge = 1 - Math.abs(u + v * .3) / .96 - Math.abs(v) / .61 + rough; break;
      case 2: edge = Math.max(.61 - Math.hypot(u + .31, v - .14), .57 - Math.hypot(u - .34, v + .18)) + rough; break;
      case 3: edge = Math.max(1 - Math.abs(u + .25) / .53 - Math.abs(v - .18) / .64,
        1 - Math.abs(u - .08) / .4 - Math.abs(v + .18) / .77,
        1 - Math.abs(u - .42) / .42 - Math.abs(v - .19) / .57) * .5; break;
      case 4: edge = .79 - Math.hypot(u * .92, v * 1.08) + .065 * Math.sin(angle * 7) + rough; break;
      default: edge = .84 - Math.hypot(u, v) + rough;
    }
    if (edge <= 0) continue;
    const grain = noise(x, y), clusters = noise(Math.floor(x / 3), Math.floor(y / 3));
    let tone = 4.8 + u * 2 - v * 2 + (clusters - .5) * 2 + (grain - .5) * 1.3;
    if (variant === 1 || variant === 3) {
      // Broad angular facets with fine mineral flecks, rather than round craters.
      tone += (Math.sin(u * 13 + v * 5) > 0 ? 1.6 : -1.7);
      if (Math.abs((u + v * .45 + 1) % .28) < .035) tone += 2;
    } else {
      for (const [cx, cy, radius] of craters) {
        const dx = u - cx, dy = v - cy, d = Math.hypot(dx, dy) / radius;
        if (d < 1) tone -= 2.5 + dy / radius;
        else if (d < 1.22) tone += dy < 0 ? 2.4 : -.7;
      }
      if (variant === 4 && Math.abs(Math.sin(u * 12 + Math.sin(v * 9)) * Math.cos(v * 10 - u * 4)) < .14) tone = 8 + grain * 2;
    }
    if (edge < .075) tone = u > -.2 ? 8 + grain * 2 : 4 + grain * 3;
    if (grain > .975) tone += 2;
    const color = palette[Math.max(0, Math.min(palette.length - 1, Math.round(tone)))];
    pixels.set([...color, 255], (y * COMET_HEAD_SIZE + x) * 4);
  }
}

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
    variant: Math.floor(random() * COMET_VARIANTS),
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
