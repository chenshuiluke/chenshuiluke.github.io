import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next/package.json")] }),
);
for (const [name, ratio] of [
  ["satellite", 1],
  ["rocket", 2 / 3],
]) {
  const path = new URL("../public/" + name + "-pixel-v3.webp", import.meta.url);
  const { fileURLToPath } = await import("node:url");
  const sprite = sharp(fileURLToPath(path));
  const meta = await sprite.metadata();
  assert(meta.hasAlpha, name + " needs a transparent cutout");
  assert(
    Math.abs(meta.width / meta.height - ratio) < 0.001,
    name + " keeps animation crop proportions",
  );
  const { data, info } = await sprite
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  assert.equal(data[3], 0, name + " has no opaque background");
  assert.equal(data[data.length - 1], 0, name + " has no opaque corner");
  let opaque = 0,
    transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 240) opaque++;
    if (data[i] < 10) transparent++;
  }
  assert(
    opaque > meta.width * meta.height * 0.1,
    name + " contains solid artwork",
  );
  assert(
    transparent > meta.width * meta.height * 0.25,
    name + " has transparent surrounding space",
  );
}
console.log("Spacecraft transparency and animation-layout asset checks passed");
