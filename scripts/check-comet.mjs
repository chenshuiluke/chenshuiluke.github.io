import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
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
  (component.match(/<PixelSprite/g) || []).length,
  3,
  "Nucleus and two tails render independently",
);
for (const layer of ["tail", "ionTail", "nucleus"])
  assert(component.includes(`styles.${layer}`));
for (const motion of ["tailWave", "ionWave"])
  assert(css.includes(`@keyframes ${motion}`));
assert(css.includes("prefers-reduced-motion"));
console.log("Independent tail layers and reduced-motion checks passed");
