import type { GravityBody } from "./gravity";

export type BlackHole = { x: number; y: number; strength: number; radius?: number };
export const HORIZON = 18;
export const START_RADIUS = 9;
export const MAX_RADIUS = 26;
export const HOLE_WIDTH = 96;
export const HOLE_HEIGHT = 72;

export function growBlackHole(hole: BlackHole, mass: number) {
  hole.radius = Math.min(MAX_RADIUS, (hole.radius ?? START_RADIUS) + Math.max(.65, Math.cbrt(Math.max(0, mass)) * .32));
}

// Artistic gravity: softened acceleration plus tidal drag creates a rapid inspiral.
// This is a visual interaction, not a relativistic black-hole solver.
export function pullIntoHole(body: GravityBody, hole: BlackHole, dt: number) {
  if (hole.strength <= 0) return;
  const dx = hole.x - body.x, dy = hole.y - body.y;
  const distance = Math.hypot(dx, dy);
  const force = 90_000_000 * hole.strength * (hole.radius ?? HORIZON) / HORIZON / (distance * distance + 40 ** 2) ** 1.5;
  const drag = Math.exp(-Math.max(0, 1 - distance / 240) * 5 * hole.strength * dt);
  body.vx = (body.vx + dx * force * dt) * drag;
  body.vy = (body.vy + dy * force * dt) * drag;
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > 1500) { body.vx *= 1500 / speed; body.vy *= 1500 / speed; }
}

// Swept capture prevents fast objects tunnelling through the event horizon.
export function crossedHorizon(x: number, y: number, body: GravityBody, hole: BlackHole) {
  if (hole.strength < 0.2) return false;
  const dx = body.x - x, dy = body.y - y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((hole.x - x) * dx + (hole.y - y) * dy) / length)) : 0;
  return Math.hypot(x + dx * t - hole.x, y + dy * t - hole.y) < (hole.radius ?? HORIZON);
}

export function tidalShape(body: GravityBody, hole: BlackHole) {
  const dx = hole.x - body.x, dy = hole.y - body.y;
  const distance = Math.hypot(dx, dy);
  const amount = Math.max(0, 1 - distance / (150 + (hole.radius ?? HORIZON) * 5)) * hole.strength;
  return {
    amount,
    angle: Math.atan2(dy, dx) * 180 / Math.PI,
    stretch: 1 + 5 * amount ** 3,
    squeeze: 1 / (1 + 5 * amount ** 2),
    opacity: 1 - amount * Math.max(0, 1 - distance / 65),
  };
}

export function respawnPlanet(body: GravityBody, width: number, height: number, cameraY: number, random = Math.random) {
  const edge = Math.floor(random() * 4);
  body.x = edge === 1 ? width + 140 : edge === 3 ? -140 : width * random();
  body.y = cameraY + (edge === 0 ? -140 : edge === 2 ? height + 140 : height * random());
  const angle = Math.atan2(cameraY + height / 2 - body.y, width / 2 - body.x);
  body.vx = Math.cos(angle) * 65;
  body.vy = Math.sin(angle) * 65;
}

export type TidalStream = {
  fragments: (GravityBody & { swallowed: boolean })[];
  diameter: number;
  age: number;
};

export function createTidalStream(body: GravityBody, hole: BlackHole, diameter: number): TidalStream {
  const angle = Math.atan2(hole.y - body.y, hole.x - body.x);
  return { diameter, age: 0, fragments: Array.from({ length: 12 }, (_, i) => {
    const offset = ((i + .5) / 12 - .5) * diameter;
    return { x: body.x + Math.cos(angle) * offset, y: body.y + Math.sin(angle) * offset,
      vx: body.vx, vy: body.vy, mass: 0, swallowed: false };
  }) };
}

export function stepTidalStream(stream: TidalStream, hole: BlackHole, dt: number) {
  stream.age += dt;
  for (const fragment of stream.fragments) {
    if (fragment.swallowed) continue;
    const { x, y } = fragment;
    pullIntoHole(fragment, hole, dt);
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.swallowed = crossedHorizon(x, y, fragment, hole);
  }
}

// Each textured strip follows its own trajectory: the nearer hemisphere falls
// faster, thinning the stream rather than stretching a whole sprite uniformly.
export function drawTidalStream(context: CanvasRenderingContext2D, image: HTMLCanvasElement, stream: TidalStream, hole: BlackHole) {
  const { fragments, diameter, age } = stream;
  const baseWidth = diameter / fragments.length;
  context.save();
  context.imageSmoothingEnabled = false;
  fragments.forEach((fragment, i) => {
    if (fragment.swallowed) return;
    const neighbor = fragments[i + 1] ?? fragments[i - 1];
    const direction = i + 1 < fragments.length ? 1 : -1;
    const dx = (neighbor.x - fragment.x) * direction, dy = (neighbor.y - fragment.y) * direction;
    const width = Math.max(baseWidth, Math.min(baseWidth * 12, Math.hypot(dx, dy) + 1));
    const height = Math.max(2, diameter * baseWidth / width);
    const distance = Math.hypot(fragment.x - hole.x, fragment.y - hole.y);
    const fade = hole.strength > 0 ? Math.max(0, Math.min(1, (distance - (hole.radius ?? HORIZON)) / 18)) : 1;
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, (4 - age) * 2)) * fade;
    context.translate(Math.round(fragment.x), Math.round(fragment.y));
    context.rotate(Math.atan2(dy, dx));
    context.drawImage(image, i * image.width / fragments.length, 0, image.width / fragments.length, image.height,
      -width / 2, -height / 2, width, height);
    context.restore();
  });
  context.restore();
}

// Cached low-resolution frames: dithered bands, bright lensing arcs and orbiting embers.
export function paintBlackHole(pixels: Uint8ClampedArray, phase: number) {
  const palette = [[37, 24, 65], [79, 37, 100], [135, 47, 110], [197, 60, 77], [237, 87, 52], [255, 144, 56], [255, 195, 94], [255, 226, 157], [255, 250, 223]];
  for (let y = 0; y < HOLE_HEIGHT; y++) for (let x = 0; x < HOLE_WIDTH; x++) {
    const px = x - HOLE_WIDTH / 2, py = y - HOLE_HEIGHT / 2;
    const rx = px * .94 - py * .342, ry = px * .342 + py * .94;
    const radius = Math.hypot(px, py);
    const disk = Math.hypot(rx / 39, ry / 9);
    let color = -1, alpha = 255;
    if (radius < 11) color = -2;
    else if (radius < 12.5) color = px < 0 ? 8 : 6;
    else if (radius < 14) color = 2;
    else if (radius < 16 && py < -3) color = px < 0 ? 7 : 4;
    else if (radius < 20 && (x + y) % 3 === 0) { color = 1; alpha = 110; }
    if (disk > .34 && disk < 1 && (ry > 2 || radius > 13)) {
      const angle = Math.atan2(ry / 9, rx / 39);
      const bands = Math.sin(angle * 6 - phase * Math.PI * 2 + disk * 38);
      const flecks = Math.sin(angle * 23 + disk * 71 - phase * Math.PI * 4);
      const dither = ((x & 1) ^ (y & 1)) * .7;
      color = Math.max(0, Math.min(8, Math.floor(2 + (1 - disk) * 5 + bands * 1.5 + flecks * .8 + dither + (rx < 0 ? 1 : 0))));
      alpha = disk > .94 ? 160 : 255;
    }
    const i = (y * HOLE_WIDTH + x) * 4;
    const rgb = color === -2 ? [2, 2, 9] : palette[color];
    pixels[i] = rgb?.[0] ?? 0;
    pixels[i + 1] = rgb?.[1] ?? 0;
    pixels[i + 2] = rgb?.[2] ?? 0;
    pixels[i + 3] = color === -1 ? 0 : alpha;
  }
  for (let i = 0; i < 14; i++) {
    const angle = i * Math.PI * 2 / 14 + phase * Math.PI * 2;
    const rx = Math.cos(angle) * (39 + i % 3 * 2), ry = Math.sin(angle) * 11;
    const x = Math.round(HOLE_WIDTH / 2 + rx * .94 + ry * .342);
    const y = Math.round(HOLE_HEIGHT / 2 - rx * .342 + ry * .94);
    const index = (y * HOLE_WIDTH + x) * 4;
    pixels.set([...palette[i % 3 ? 5 : 8], 220], index);
  }
}
