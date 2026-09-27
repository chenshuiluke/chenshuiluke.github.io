import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import {
  createCometFlight,
  sampleCometFlight,
} from "../src/lib/comet-flight.ts";
import {
  cometTailOffset,
  cometParticle,
  paintComet,
} from "../src/lib/comet-tail.ts";
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
assert.equal(info.width / info.height, 3, "Comet proportions remain intact");
let transparent = 0,
  opaque = 0;
for (let i = 3; i < data.length; i += 4) {
  if (data[i] === 0) transparent++;
  if (data[i] >= 240) opaque++;
}
assert(
  transparent > info.width * info.height * 0.25,
  "Background is genuinely transparent",
);
assert(
  opaque > info.width * info.height * 0.1,
  "Detailed nucleus and tails remain visible",
);
// Generated alpha may retain an imperceptible 1/255 at the padded corners.
assert(data[3] <= 2);
assert(data[data.length - 1] <= 2);
console.log("Comet alpha, detail coverage and proportions passed");

const component = readFileSync(
  new URL("../src/components/Comets/Comets.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(
  new URL("../src/components/Comets/Comets.module.css", import.meta.url),
  "utf8",
);
assert.equal(
  (component.match(/<CometSprite/g) || []).length,
  1,
  "One intact sprite, no duplicated tail ghosts",
);
for (let t = 0; t < 10; t += 0.1) {
  for (let x = 0; x < 192; x += 2) {
    const offset = cometTailOffset(x, t);
    assert(Math.abs(offset) <= 8, "Ripple fits transparent padding");
    if (x >= 144) assert.equal(offset, 0, "Nucleus never bends");
    assert(
      Math.abs(cometTailOffset(x, t + 1 / 60) - offset) < 0.94,
      "Small smooth frame-to-frame motion",
    );
  }
}
assert.notEqual(cometTailOffset(20, 0), cometTailOffset(20, 0.5));
// Follow a crest for 0.1s: phase velocity is -17 * 7 pixels/second.
const envelope = (x) => ((144 - x) / 144) ** 1.2;
assert(
  Math.abs(
    cometTailOffset(80, 0) / envelope(80) -
      cometTailOffset(68.1, 0.1) / envelope(68.1),
  ) < 1e-10,
);
assert(
  !css.includes("skewY") && !css.includes("scale("),
  "No elastic CSS stretching",
);
assert(css.includes("prefers-reduced-motion"));
assert(
  cometParticle(0, 0.2).x < cometParticle(0, 0.1).x,
  "Dust streams backward",
);
const source = new Uint8ClampedArray(
  await sharp(
    fileURLToPath(new URL("../public/comet-pixel.webp", import.meta.url)),
  )
    .resize(192, 64, { kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer(),
);
const a = new Uint8ClampedArray(192 * 96 * 4),
  b = new Uint8ClampedArray(a.length);
paintComet(a, source, 0);
paintComet(b, source, 0.25);
let changed = 0,
  visibleTail = 0;
for (let y = 0; y < 96; y++)
  for (let x = 0; x < 192; x++) {
    const offset = (y * 192 + x) * 4;
    if (x >= 144)
      assert.deepEqual(
        a.subarray(offset, offset + 4),
        b.subarray(offset, offset + 4),
        "Head pixels stay identical",
      );
    else if (a[offset + 3] > 100 || b[offset + 3] > 100) {
      visibleTail++;
      if (
        Math.abs(a[offset] - b[offset]) +
          Math.abs(a[offset + 3] - b[offset + 3]) >
        20
      )
        changed++;
    }
  }
assert(
  changed / visibleTail > 0.25,
  "Tail has substantial visible motion in a quarter second",
);
console.log(
  `Visible tail change: ${Math.round((changed / visibleTail) * 100)}%`,
);
console.log(
  "Anchored nucleus, outward ripple, smoothness and reduced-motion checks passed",
);

let seed = 29;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const edges = new Set();
let curves = 0;
for (let i = 0; i < 300; i++) {
  const flight = createCometFlight(390, 844, random);
  const edge = (p) =>
    p.y < 0 ? "top" : p.x > 390 ? "right" : p.y > 844 ? "bottom" : "left";
  edges.add(edge(flight.start));
  assert.notEqual(edge(flight.start), edge(flight.end));
  assert.deepEqual(
    { x: sampleCometFlight(flight, 0).x, y: sampleCometFlight(flight, 0).y },
    flight.start,
  );
  assert.deepEqual(
    { x: sampleCometFlight(flight, 1).x, y: sampleCometFlight(flight, 1).y },
    flight.end,
  );
  const mid = sampleCometFlight(flight, 0.5),
    next = sampleCometFlight(flight, 0.50001);
  const heading = (Math.atan2(next.y - mid.y, next.x - mid.x) * 180) / Math.PI;
  assert(
    Math.abs(((heading - mid.angle + 540) % 360) - 180) < 0.1,
    "Head follows the path tangent",
  );
  assert(Number.isFinite(mid.bend) && Math.abs(mid.bend) <= 8);
  if (Math.abs(mid.bend) > 0.1) curves++;
}
assert.equal(edges.size, 4, "Random flights enter from every edge");
assert(curves > 200, "Flights have varied visible curvature");
for (const bend of [-8, 8]) {
  paintComet(b, source, 0.25, bend);
  for (let y = 0; y < 96; y++)
    for (let x = 144; x < 192; x++) {
      const offset = (y * 192 + x) * 4;
      assert.deepEqual(
        a.subarray(offset, offset + 4),
        b.subarray(offset, offset + 4),
        "Turning never deforms the head",
      );
    }
}
console.log(
  "Random edge coverage, curve tangents, tail bend and fixed head checks passed",
);
