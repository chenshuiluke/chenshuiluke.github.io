import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  spherePixels,
  paintPlanet,
  planetMaps,
} from "../src/lib/pixel-planets.ts";
const size = 96;
const pixels = spherePixels(size);
assert.deepEqual(
  pixels,
  spherePixels(size),
  "Projection must be deterministic",
);
assert(
  pixels.length > 6800 && pixels.length < 7100,
  "Complete disc, transparent corners",
);
assert(
  pixels.every(
    (p) =>
      p.offset < size * size * 4 &&
      p.u >= 0 &&
      p.u < 1 &&
      p.v >= 0 &&
      p.v <= 1 &&
      p.light >= 0 &&
      p.light <= 1,
  ),
);
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);
const texture = new Uint8ClampedArray(
  await sharp(
    fileURLToPath(new URL("../public" + planetMaps.moon, import.meta.url)),
  )
    .resize(384, 192, { kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer(),
);
const render = (turn) => {
  const output = new Uint8ClampedArray(size * size * 4);
  paintPlanet(output, texture, 384, 192, pixels, turn);
  return output;
};
const first = render(0);
assert.equal(first[3], 0, "Corners remain transparent");
assert.equal(first[(48 * size + 48) * 4 + 3], 255, "Sphere is opaque");
assert.notDeepEqual(first, render(0.25), "Rotation reveals different terrain");
assert.deepEqual(
  render(0.125),
  render(1.125),
  "Longitude wraps without a seam",
);
assert.deepEqual(render(-0.125), render(0.875), "Negative rotation wraps");
const moonPixels = spherePixels(size, true);
assert(
  moonPixels.every((p) => p.light >= 0.24),
  "Moon shadow retains visible surface detail",
);
assert(
  moonPixels.filter((p) => p.light >= 0.5).length > moonPixels.length * 0.4,
  "Moon has a broad readable sunlit face",
);
assert.equal(new Set(Object.values(planetMaps)).size, 5);
for (const file of Object.values(planetMaps))
  assert(
    readFileSync(new URL("../public" + file, import.meta.url)).length > 10000,
    "Terrain asset exists",
  );
let textureBytes = 0;
for (const file of Object.values(planetMaps)) {
  const buffer = readFileSync(new URL("../public" + file, import.meta.url));
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.width, 384);
  assert.equal(metadata.height, 192);
  textureBytes += buffer.length;
}
assert(textureBytes < 800000, "All terrain downloads together stay below 800 KB");
const css = readFileSync(
  new URL(
    "../src/components/FloatingObject/FloatingObject.module.css",
    import.meta.url,
  ),
  "utf8",
);
assert.match(css, /animation:\s*objFloat/);
assert.match(css, /@keyframes objFloat/);
console.log(
  "Sphere projection, rotation, shading, assets, and drift checks passed",
);
