import type { GravityBody } from "./gravity";
import type { AntimatterMissile, BlackHole } from "./black-hole";

export const UFO_WIDTH = 24;
export const UFO_HEIGHT = 20;
const FRAMES = 10;
export type Ufo = {
  body: GravityBody;
  kind: number;
  age: number;
  delay: number;
  targetX: number;
  targetY: number;
  retarget: number;
  panic: boolean;
  fuel: number;
  boosting: boolean;
  thrustAngle: number;
  weaponCooldown: number;
};

export function createUfo(index: number, width: number, height: number, cameraY: number, random = Math.random): Ufo {
  const right = index % 2 === 0;
  return {
    body: { x: width * (right ? .84 : .14), y: cameraY + height * (right ? .28 : .6), vx: right ? -28 : 28, vy: 0, mass: 3 },
    kind: index % 3, age: 0, delay: index * 2 + .6,
    targetX: width * (right ? .15 : .85), targetY: cameraY + height * (.25 + random() * .45), retarget: 5, panic: false,
    fuel: 1, boosting: false, thrustAngle: 0, weaponCooldown: .3,
  };
}

// Powered craft steer; the shared gravity integrator still owns their positions.
export function steerUfo(ufo: Ufo, dt: number, width: number, height: number, cameraY: number, hole: BlackHole, random = Math.random) {
  ufo.age += dt;
  ufo.weaponCooldown = Math.max(0, ufo.weaponCooldown - dt);
  ufo.retarget -= dt;
  const { body } = ufo;
  if (ufo.retarget <= 0 || Math.hypot(body.x - ufo.targetX, body.y - ufo.targetY) < 35) {
    ufo.targetX = width * (body.x < width / 2 ? .72 + random() * .14 : .14 + random() * .14);
    ufo.targetY = cameraY + height * (.2 + random() * .55);
    ufo.retarget = 4 + random() * 4;
  }
  const distance = Math.hypot(body.x - hole.x, body.y - hole.y);
  ufo.panic = hole.strength > .2 && distance < (ufo.panic ? 340 : 220);
  ufo.boosting = ufo.panic && (ufo.boosting ? ufo.fuel > 0 : ufo.fuel > .55);
  ufo.fuel = Math.max(0, Math.min(1, ufo.fuel + dt * (ufo.boosting ? -1.15 : ufo.panic ? .03 : .16)));
  const dx = ufo.panic ? body.x - hole.x : ufo.targetX - body.x;
  const dy = ufo.panic ? body.y - hole.y : ufo.targetY - body.y;
  const length = Math.hypot(dx, dy) || 1;
  ufo.thrustAngle = Math.atan2(dy, dx);
  const speed = ufo.boosting ? 280 : ufo.panic ? 110 : 48;
  // Finite fuel and thrust: escape is possible, but the innermost pull still wins.
  const limit = (ufo.boosting ? 1100 : ufo.panic ? 260 : 75) * dt;
  body.vx += Math.max(-limit, Math.min(limit, dx / length * speed - body.vx));
  body.vy += Math.max(-limit, Math.min(limit, dy / length * speed - body.vy));
}

export function fireAntimatter(ufo: Ufo, hole: BlackHole): AntimatterMissile | null {
  const dx = hole.x - ufo.body.x, dy = hole.y - ufo.body.y, distance = Math.hypot(dx, dy);
  if (ufo.delay > 0 || ufo.weaponCooldown > 0 || hole.strength <= .2 || distance > 600 || distance < (hole.radius ?? 18)) return null;
  ufo.weaponCooldown = 8 + ufo.kind * .5;
  return { body: { x: ufo.body.x, y: ufo.body.y, vx: dx / distance * 600, vy: dy / distance * 600, mass: 0 }, age: 0, hit: false };
}

export function drawAntimatter(context: CanvasRenderingContext2D, missile: AntimatterMissile, seconds: number) {
  context.save();
  context.translate(Math.round(missile.body.x), Math.round(missile.body.y));
  if (missile.hit) {
    context.globalAlpha = Math.max(0, 1 - missile.age / .4);
    const radius = 22 + missile.age * 170;
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      context.fillStyle = i % 2 ? "#9cfbff" : "#dd9aff";
      context.fillRect(Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius), 5, 5);
    }
  } else {
    context.rotate(Math.atan2(missile.body.vy, missile.body.vx));
    const flicker = Math.floor(seconds * 18) % 3 * 3;
    context.fillStyle = "#8453cf";
    context.fillRect(-28 - flicker, -3, 26 + flicker, 6);
    context.fillStyle = "#67eaff";
    context.fillRect(-20 - flicker, -1, 22 + flicker, 2);
    context.fillRect(-6, -4, 8, 8);
    context.fillStyle = "#f4ffff";
    context.fillRect(-3, -2, 10, 4);
    context.fillStyle = "#d5a1ff";
    context.fillRect(-8, -6, 3, 3); context.fillRect(-8, 3, 3, 3);
  }
  context.restore();
}

type Color = readonly [number, number, number];
const ink: Color = [13, 19, 40], glass: Color = [26, 56, 77], glassLight: Color = [116, 205, 219];
const cream: Color = [250, 237, 191], eye: Color = [9, 17, 33], red: Color = [255, 99, 97];
const crews = [
  { skin: [144, 220, 109], light: [213, 255, 152], shade: [54, 119, 97], hull: [111, 172, 188], trim: [151, 245, 224] },
  { skin: [184, 137, 229], light: [237, 188, 250], shade: [94, 69, 153], hull: [179, 134, 105], trim: [255, 204, 109] },
  { skin: [244, 135, 121], light: [255, 210, 161], shade: [157, 71, 105], hull: [115, 127, 193], trim: [191, 177, 255] },
] as const;

// Drawn at the smallest display size: every eye, highlight and rim pixel survives.
export function paintUfo(pixels: Uint8ClampedArray, kind: number, frame: number) {
  pixels.fill(0);
  const crew = crews[kind % crews.length], panic = frame >= 8, blink = frame === 7;
  const pixel = (x: number, y: number, color: Color) => {
    if (x < 0 || y < 0 || x >= UFO_WIDTH || y >= UFO_HEIGHT) return;
    pixels.set([...color, 255], (y * UFO_WIDTH + x) * 4);
  };
  const rect = (x: number, y: number, w: number, h: number, color: Color) => {
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) pixel(px, py, color);
  };
  // Stepped bubble canopy, dark outline and one clean glass reflection.
  rect(7, 2, 10, 1, ink); rect(5, 3, 14, 2, ink); rect(4, 5, 16, 8, ink);
  rect(7, 3, 10, 1, glassLight); rect(5, 5, 14, 8, glass);
  rect(6, 4, 12, 1, glassLight); rect(5, 6, 1, 4, glassLight);
  pixel(6, 5, cream);
  // Large faces occupy most of the canopy, not a tiny fraction of the sprite.
  rect(9, 5, 6, 1, crew.light); rect(8, 6, 8, 5, crew.skin);
  rect(9, 11, 6, 2, crew.shade); rect(8, 6, 1, 4, crew.light);
  rect(15, 7, 1, 4, crew.shade);
  if (kind === 0) {
    // Mint pilot: antennae and bold slanted dark eyes.
    rect(9, 3, 1, 3, crew.skin); rect(14, 3, 1, 3, crew.skin);
    pixel(8, 2, crew.light); pixel(15, 2, crew.light);
    rect(9, 7, 2, blink ? 1 : 3, eye); rect(13, 7, 2, blink ? 1 : 3, eye);
    if (!blink) { pixel(9, 7, cream); pixel(13, 7, cream); }
    pixel(10, 9, crew.skin); pixel(13, 9, crew.skin);
  } else if (kind === 1) {
    // Violet cyclops: one unmistakable ivory eye, with horn-like ears.
    rect(7, 6, 1, 2, crew.light); rect(16, 6, 1, 2, crew.shade);
    rect(9, 6, 6, 5, crew.shade); rect(9, 7, 6, blink ? 1 : 3, cream);
    rect(11, 7, 2, blink ? 1 : 3, eye);
    if (!blink) pixel(11, 7, glassLight);
  } else {
    // Coral navigator: three eyes and animated tentacles over the cockpit edge.
    for (let i = 0; i < 3; i++) {
      rect(8 + i * 3, 7, 2, blink ? 1 : 3, cream);
      if (!blink) pixel(9 + i * 3, 8, eye);
      const y = 12 + (frame + i) % 2;
      rect(8 + i * 3, 11, 2, y - 10, crew.skin);
      pixel(8 + i * 3, y, crew.light);
    }
  }
  rect(11, 11, 2, panic ? 2 : 1, eye);
  if (panic) { pixel(7, 10, cream); pixel(16, 10, cream); }
  // Slim saucer: a readable rim, three running lights and a pulsing engine.
  rect(3, 13, 18, 1, ink); rect(1, 14, 22, 3, ink); rect(4, 17, 16, 1, ink);
  rect(4, 13, 16, 1, crew.hull); rect(2, 14, 20, 1, crew.trim);
  rect(4, 14, 7, 1, cream); rect(3, 15, 18, 2, crew.hull);
  rect(5, 16, 14, 1, glass);
  for (let i = 0; i < 3; i++) {
    rect(5 + i * 6, 15, 2, 1, panic ? red : (i + frame) % 3 === 0 ? cream : crew.trim);
  }
  rect(9, 18, 6, 1, ink); rect(10, 18, 4, 1, crew.trim);
  rect(11, 19, 2, 1, frame % 2 ? cream : glassLight);
}

export function createUfoAtlas() {
  const atlas = document.createElement("canvas");
  atlas.width = UFO_WIDTH * FRAMES; atlas.height = UFO_HEIGHT * 3;
  const context = atlas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(UFO_WIDTH, UFO_HEIGHT);
  for (let kind = 0; kind < 3; kind++) for (let frame = 0; frame < FRAMES; frame++) {
    paintUfo(image.data, kind, frame);
    context.putImageData(image, frame * UFO_WIDTH, kind * UFO_HEIGHT);
  }
  return atlas;
}

export function drawUfo(context: CanvasRenderingContext2D, atlas: HTMLCanvasElement, ufo: Ufo, seconds: number, viewportWidth: number) {
  const frame = ufo.panic ? 8 + Math.floor(seconds * 2) % 2 : Math.floor(seconds * 4 + ufo.kind * 2) % 8;
  const size = Math.round(Math.max(24, Math.min(40, viewportWidth * .027)));
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = Math.min(1, ufo.age * 2);
  context.translate(Math.round(ufo.body.x), Math.round(ufo.body.y + Math.sin(seconds * 2 + ufo.kind) * 2));
  if (ufo.boosting) {
    context.save();
    context.rotate(ufo.thrustAngle);
    context.scale(size / 128, size / 128);
    const pulse = Math.floor(seconds * 8) % 3 * 3;
    context.fillStyle = "#6d59c4";
    context.fillRect(-48 - 34 - pulse, -5, 38 + pulse, 10);
    context.fillStyle = "#68e3ed";
    context.fillRect(-48 - 23 - pulse, -3, 28 + pulse, 6);
    context.fillStyle = "#fff0c2";
    context.fillRect(-48 - 12, -2, 17, 4);
    context.restore();
  }
  // Keep the tiny face level and pixel-aligned instead of rotating away its eyes.
  const height = Math.round(size * UFO_HEIGHT / UFO_WIDTH);
  context.drawImage(atlas, frame * UFO_WIDTH, ufo.kind * UFO_HEIGHT, UFO_WIDTH, UFO_HEIGHT, -Math.floor(size / 2), -Math.floor(height / 2), size, height);
  context.restore();
}
