import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import {
  createCometFlight,
  sampleCometFlight,
  cometEmbers,
  drawCometFire,
} from "../src/lib/comet-flight.ts";
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
  new URL("../src/components/Comets/Comets.tsx", import.meta.url),
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
assert(
  css.includes("clip-path: inset(0 0 0 76%)"),
  "The old painted ribbon is not rendered",
);
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
  edges.add(edge(f.start));
  assert.notEqual(edge(f.start), edge(f.end));
  const mid = sampleCometFlight(f, 0.5),
    next = sampleCometFlight(f, 0.50001);
  const heading = (Math.atan2(next.y - mid.y, next.x - mid.x) * 180) / Math.PI;
  assert(
    Math.abs(((heading - mid.angle + 540) % 360) - 180) < 0.1,
    "Head follows curve tangent",
  );
  for (const p of cometEmbers(f, 2)) {
    assert(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert(p.alpha >= 0 && p.alpha <= 1 && p.size >= 1);
  }
}
assert.equal(edges.size, 4);
const f = {
  start: { x: 0, y: 240 },
  control: { x: 280, y: -200 },
  end: { x: 550, y: 250 },
  duration: 4,
  hue: 20,
};
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
  "World-space embers, independent velocity, fade, bounded lifetime, randomized arcs and accessibility checks passed",
);
