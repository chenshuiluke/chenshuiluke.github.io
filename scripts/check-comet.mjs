import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import {
  createCometFlight,
  sampleCometFlight,
  recordCometTrail,
  cometEmbers,
  drawCometFire,
} from "../src/lib/comet-flight.ts";
import { stepGravity, PHYSICS_STEP } from "../src/lib/gravity.ts";
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);
const { data, info } = await sharp(
  fileURLToPath(new URL("../public/comet-pixel.webp", import.meta.url)),
)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
assert.equal(info.width / info.height, 3);
assert(
  data[3] <= 2 && data[data.length - 1] <= 2,
  "Head artwork keeps transparent corners",
);
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
const outline = [...css.match(/clip-path: polygon\(([\s\S]*?)\);/)[1]
  .matchAll(/([\d.]+)%\s+([\d.]+)%/g)].map((m) => [+m[1], +m[2]]);
const insideHead = (x, y) => {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, ay] = outline[i], [bx, by] = outline[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
};
assert(insideHead(88, 56), "Keep the detailed nucleus");
for (const [x, y] of [[76, 56], [80, 38], [82, 82], [90, 88]])
  assert(!insideHead(x, y), "Exclude baked-in flame above, behind and below nucleus");
assert(css.includes("prefers-reduced-motion"));
let seed = 29;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const edges = new Set();
for (let i = 0; i < 300; i++) {
  const f = createCometFlight(390, 844, random);
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
const ctx = {
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  fillStyle: "",
  fillRect() {
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
console.log(
  "Gravity trajectory history, world-space embers, fade, bounded lifetime and accessibility checks passed",
);
