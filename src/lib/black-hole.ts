import type { GravityBody } from "./gravity";

export type BlackHole = { x: number; y: number; strength: number; radius?: number };
export const HORIZON = 18;
export const START_RADIUS = 9;
export const MAX_RADIUS = 26;
export const HOLE_WIDTH = 96;
export const HOLE_HEIGHT = 72;

export function textBulge(hole: BlackHole, x: number, y: number) {
  if (hole.strength <= 0) return { x: 0, y: 0, scale: 1 };
  const dx = hole.x - x, dy = hole.y - y, distance = Math.hypot(dx, dy);
  const amount = Math.max(0, 1 - distance / 240) ** 2 * hole.strength;
  return { x: dx / (distance + 40) * amount * 7, y: dy / (distance + 40) * amount * 7, scale: 1 + amount * .055 };
}

export function growBlackHole(hole: BlackHole, mass: number) {
  hole.radius = Math.min(MAX_RADIUS, (hole.radius ?? START_RADIUS) + Math.max(1.2, Math.cbrt(Math.max(0, mass)) * .55));
}

export type AntimatterMissile = { body: GravityBody; age: number; hit: boolean };

// Missiles are powered projectiles, not gravity sources or edible mass.
export function stepAntimatter(missile: AntimatterMissile, hole: BlackHole, dt: number) {
  missile.age += dt;
  if (missile.hit) return false;
  const { body } = missile;
  const { x, y } = body;
  if (hole.strength > .2) {
    const dx = hole.x - x, dy = hole.y - y, distance = Math.hypot(dx, dy) || 1;
    const turn = 1 - Math.exp(-dt * 9);
    body.vx += (dx / distance * 800 - body.vx) * turn;
    body.vy += (dy / distance * 800 - body.vy) * turn;
    pullIntoHole(body, hole, dt);
  }
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  if (!crossedHorizon(x, y, body, hole)) return false;
  hole.radius = Math.max(4, (hole.radius ?? START_RADIUS) * .72);
  missile.hit = true;
  missile.age = 0;
  body.x = hole.x; body.y = hole.y;
  return true;
}

// Brief, local hit feedback on the existing tiny cursor canvas; no full-screen flash.
export function drawBlackHoleDamage(context: CanvasRenderingContext2D, age: number) {
  if (age < 0 || age >= .7) return;
  const fade = 1 - age / .7;
  context.save();
  context.globalAlpha = fade;
  // Broken cyan/violet lensing arcs and pieces blasted out of the accretion disk.
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI / 12 + age * 2;
    const radius = i % 3 ? 13 + age * 9 : 18 + age * 22;
    const x = Math.round(HOLE_WIDTH / 2 + Math.cos(angle) * radius);
    const y = Math.round(HOLE_HEIGHT / 2 + Math.sin(angle) * radius * .8);
    context.fillStyle = i % 2 ? "#99f4ff" : "#d18bff";
    context.fillRect(x, y, i % 3 ? 2 : 3, 2);
  }
  // Stepped energy fissures briefly cut through the dark core, then heal.
  context.globalAlpha = fade * fade;
  context.fillStyle = age < .12 ? "#f1ffff" : "#b2a1ff";
  for (let i = 0; i < 7; i++) {
    context.fillRect(43 + (i % 3) * 2, 26 + i * 3, 3, 4);
    if (i > 2 && i < 6) context.fillRect(46 + i, 29 + i * 2, 4, 2);
  }
  // Dark gaps make the normally continuous disk appear disrupted on impact.
  context.globalAlpha = fade * .85;
  context.fillStyle = "#090816";
  context.fillRect(18, 42, 5, 3); context.fillRect(66, 26, 7, 3);
  context.restore();
}

// Local artistic gravity: flybys retain momentum; capture requires a close approach.
// This is a visual interaction, not a relativistic black-hole solver.
export function pullIntoHole(body: GravityBody, hole: BlackHole, dt: number) {
  if (hole.strength <= 0) return;
  const dx = hole.x - body.x, dy = hole.y - body.y;
  const distance = Math.hypot(dx, dy);
  const radius = hole.radius ?? HORIZON;
  const falloff = Math.max(0, 1 - distance / (320 + radius * 4));
  if (falloff === 0) return;
  const force = 60_000_000 * falloff * hole.strength * radius / HORIZON / (distance * distance + 40 ** 2) ** 1.5;
  const drag = Math.exp(-Math.max(0, 1 - distance / 120) * 1.8 * hole.strength * dt);
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

export function tidalShape(body: GravityBody, hole: BlackHole, bodyRadius = 0) {
  const dx = hole.x - body.x, dy = hole.y - body.y;
  const distance = Math.max(0, Math.hypot(dx, dy) - bodyRadius);
  const radius = hole.radius ?? HORIZON;
  const amount = Math.max(0, 1 - Math.max(0, distance - radius) / (65 + radius * 2)) * hole.strength;
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
  angle: number;
};

export function createTidalStream(body: GravityBody, hole: BlackHole, diameter: number): TidalStream {
  const angle = Math.atan2(hole.y - body.y, hole.x - body.x);
  const distance = Math.hypot(hole.x - body.x, hole.y - body.y);
  return { diameter, age: 0, angle, fragments: Array.from({ length: 16 }, (_, i) => {
    const offset = ((i + .5) / 16 - .5) * diameter;
    return { x: body.x + Math.cos(angle) * offset, y: body.y + Math.sin(angle) * offset,
      vx: body.vx, vy: body.vy, mass: 0, swallowed: hole.strength > .2 && offset >= distance - (hole.radius ?? HORIZON) };
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

// Join living slices at their midpoints, then taper small texture segments along
// that centerline. A swallowed neighbor ends at the hole, never its stale position.
export function drawTidalStream(context: CanvasRenderingContext2D, image: HTMLCanvasElement, stream: TidalStream, hole: BlackHole) {
  const { fragments, diameter, age } = stream;
  const baseWidth = diameter / fragments.length;
  context.save();
  context.imageSmoothingEnabled = false;
  fragments.forEach((fragment, i) => {
    if (fragment.swallowed) return;
    const previous = fragments[i - 1], next = fragments[i + 1];
    const forward = next && !next.swallowed ? Math.atan2(next.y - fragment.y, next.x - fragment.x)
      : hole.strength > .2 ? Math.atan2(hole.y - fragment.y, hole.x - fragment.x) : stream.angle;
    const leftX = previous && !previous.swallowed ? (previous.x + fragment.x) / 2 : fragment.x - Math.cos(forward) * baseWidth / 2;
    const leftY = previous && !previous.swallowed ? (previous.y + fragment.y) / 2 : fragment.y - Math.sin(forward) * baseWidth / 2;
    let rightX = next && !next.swallowed ? (next.x + fragment.x) / 2 : fragment.x + Math.cos(forward) * baseWidth / 2;
    let rightY = next && !next.swallowed ? (next.y + fragment.y) / 2 : fragment.y + Math.sin(forward) * baseWidth / 2;
    if (next?.swallowed && hole.strength > .2) { rightX = hole.x; rightY = hole.y; }
    const dx = rightX - leftX, dy = rightY - leftY, length = Math.hypot(dx, dy);
    // Don't bridge widely separated debris with giant bars of stretched terrain.
    if (length < .1 || length > baseWidth * 6) return;
    const stretch = Math.max(1, length / baseWidth);
    for (let part = 0; part < 4; part++) {
      const t = (part + .5) / 4;
      const x = leftX + dx * t, y = leftY + dy * t;
      const distance = Math.hypot(x - hole.x, y - hole.y);
      const clearance = distance - (hole.radius ?? HORIZON);
      if (hole.strength > .2 && clearance <= 0) continue;
      const taper = hole.strength > .2 ? Math.min(1, Math.max(0, clearance) / Math.max(30, diameter * .65)) : 1;
      const height = diameter / stretch * taper;
      const fade = hole.strength > .2 ? Math.min(1, Math.max(0, clearance) / 12) : 1;
      context.save();
      context.globalAlpha = Math.max(0, Math.min(1, (4 - age) * 2)) * fade;
      context.translate(Math.round(x), Math.round(y));
      context.rotate(Math.atan2(dy, dx));
      context.drawImage(image, (i + part / 4) * image.width / fragments.length, 0, image.width / fragments.length / 4, image.height,
        -length / 8 - .35, -height / 2, length / 4 + .7, height);
      context.restore();
    }
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
