import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import {
  createCometFlight,
  sampleCometFlight,
  recordCometTrail,
  cometEmbers,
  drawCometFire,
  paintCometHead, COMET_HEAD_SIZE, COMET_VARIANTS,
} from "../src/lib/comet-flight.ts";
import { stepGravity, PHYSICS_STEP } from "../src/lib/gravity.ts";
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);
const heads = Array.from({ length: COMET_VARIANTS }, (_, variant) => {
  const pixels = new Uint8ClampedArray(COMET_HEAD_SIZE ** 2 * 4);
  paintCometHead(pixels, variant);
  assert.equal(pixels[3], 0);
  assert.equal(pixels[pixels.length - 1], 0, "Nuclei have transparent corners and no baked-in tail");
  assert(pixels.filter((value, i) => i % 4 === 3 && value).length > 200, "Every variant has a readable solid body");
  const again = new Uint8ClampedArray(pixels.length).fill(255);
  paintCometHead(again, variant);
  assert.deepEqual(again, pixels, "Painting clears stale pixels and is deterministic");
  return pixels;
});
for (let i = 0; i < heads.length; i++) for (let j = i + 1; j < heads.length; j++) {
  const different = heads[i].filter((value, p) => p % 4 === 3 && value !== heads[j][p]).length;
  assert(different > 100, "Every pair differs in silhouette, not just color");
}
if (process.argv[2]) {
  const width = COMET_HEAD_SIZE * COMET_VARIANTS, height = COMET_HEAD_SIZE;
  const sheet = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < sheet.length; p += 4) sheet.set([13, 18, 36, 255], p);
  heads.forEach((pixels, variant) => {
    for (let y = 0; y < height; y++) for (let x = 0; x < COMET_HEAD_SIZE; x++) {
      const from = (y * COMET_HEAD_SIZE + x) * 4;
      if (pixels[from + 3]) sheet.set(pixels.subarray(from, from + 4), (y * width + variant * COMET_HEAD_SIZE + x) * 4);
    }
  });
  await sharp(sheet, { raw: { width, height, channels: 4 } }).resize(width * 4, height * 4, { kernel: "nearest" }).png().toFile(process.argv[2]);
}
const component = readFileSync(
  new URL("../src/components/Comets/SpaceSimulation.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../src/components/Comets/Comets.module.css", import.meta.url),
  "utf8",
);
assert(
  component.includes("data-comet-fire"),
  "One shared world-space fire canvas",
);
assert(!component.includes("comet-pixel.webp"), "Comets no longer download the repeated sprite");
assert(!css.includes("clip-path"), "Each nucleus owns its outline instead of sharing a clipping mask");
assert(css.includes("prefers-reduced-motion"));
let seed = 29;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const edges = new Set();
const variantsByHue = new Map();
for (let i = 0; i < 300; i++) {
  const f = createCometFlight(390, 844, random);
  const variants = variantsByHue.get(f.hue) ?? new Set();
  variants.add(f.variant); variantsByHue.set(f.hue, variants);
  const edge = (p) =>
    p.y < 0 ? "top" : p.x > 390 ? "right" : p.y > 844 ? "bottom" : "left";
  edges.add(edge(f.body));
  assert((195 - f.body.x) * f.body.vx + (422 - f.body.y) * f.body.vy > 0, "Comets launch inward");
  for (let tick = 0; tick < 240; tick++) {
    stepGravity([f.body], PHYSICS_STEP);
    f.age += PHYSICS_STEP;
    recordCometTrail(f);
  }
  assert(f.trail.length <= 171, "History is bounded");
  for (const p of cometEmbers(f, f.age)) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert(p.alpha >= 0 && p.alpha <= 1 && p.size >= 1);
  }
}
assert.equal(edges.size, 4);
for (const variants of variantsByHue.values()) assert.equal(variants.size, COMET_VARIANTS, "Shape varies independently of color");
const f = createCometFlight(550, 400, random);
f.body = { x: 0, y: 240, vx: 180, vy: -100, mass: 0.15 };
f.trail = [];
recordCometTrail(f);
const planet = { x: 280, y: 0, vx: 0, vy: 0, mass: 1000 };
for (let tick = 0; tick < 120; tick++) {
  stepGravity([planet, f.body], PHYSICS_STEP);
  f.age += PHYSICS_STEP;
  recordCometTrail(f);
}
const pose = sampleCometFlight(f, f.age);
assert(Math.hypot(pose.x - f.body.x, pose.y - f.body.y) < 1e-6, "Tail samples the integrated head, not a preset arc");
f.duration = f.age;
const frames = [0.55, 0.6, 0.65].map((t) => cometEmbers(f, t));
const survivor = frames[2].find((p) =>
  frames[0].some((q) => p.serial === q.serial),
);
assert(survivor);
const tracked = frames.map((p) => p.find((p) => p.serial === survivor.serial));
assert(tracked.every(Boolean), "Same ember survives multiple head positions");
assert(
  Math.abs(tracked[2].x - tracked[1].x - (tracked[1].x - tracked[0].x)) < 1e-8,
  "Ember retains its own horizontal velocity",
);
assert(
  Math.abs(tracked[2].y - tracked[1].y - (tracked[1].y - tracked[0].y)) < 1e-8,
  "Ember retains its own vertical velocity through a turn",
);
assert(
  tracked[2].alpha < tracked[0].alpha,
  "Embers fade rather than remain attached",
);
assert.notDeepEqual(frames[0], frames[2]);
for (const time of [0, .1, .4, .405, .8, 1, 8, .4, .405, 1.3]) {
  assert.deepEqual(cometEmbers(f, time), cometEmbers({ ...f }, time),
    "Incremental particles match fresh sampling, including jumps and rewind");
}
assert(
  cometEmbers(f, 1).some((p) => p.spark),
  "Detached sparks accompany dense fire",
);
assert.deepEqual(cometEmbers(f, -1), []);
assert.deepEqual(
  cometEmbers(f, f.duration + 1.31),
  [],
  "Old particles expire after the head exits",
);
let draws = 0;
const colors = [];
const ctx = {
  imageSmoothingEnabled: true,
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  fillStyle: "",
  fillRect(x, y, w, h) {
    assert(w >= 1 && h >= 1);
    assert(Number.isInteger(x) && Number.isInteger(y));
    const alpha = Number(this.fillStyle.match(/ \/ (.+)\)/)[1]);
    assert(alpha >= 0 && alpha <= 1);
    colors.push(this.fillStyle);
    draws++;
  },
};
drawCometFire(ctx, f, 1, 1);
assert(
  draws > 50 && draws <= 313,
  "Bounded dense fire, without a particle leak",
);
assert.equal(ctx.globalAlpha, 1);
assert.equal(ctx.globalCompositeOperation, "source-over");
assert.equal(ctx.imageSmoothingEnabled, true);
const firstColors = colors.slice();
drawCometFire(ctx, f, 1, 1);
assert.deepEqual(colors.slice(firstColors.length), firstColors, "Cached colors are stable across frames");
const visibleDraws = draws;
drawCometFire(ctx, f, 1, 1, { left: 10000, right: 11000, top: 10000, bottom: 11000 });
assert.equal(draws, visibleDraws, "Offscreen comets do not issue canvas draws");
console.log(
  "Gravity trajectory history, world-space embers, fade, bounded lifetime and accessibility checks passed",
);
