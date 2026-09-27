import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { cometTailOffset } from "../src/lib/comet-tail.ts";
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
    assert(Math.abs(offset) <= 4, "Ripple fits transparent padding");
    if (x >= 144) assert.equal(offset, 0, "Nucleus never bends");
    assert(
      Math.abs(cometTailOffset(x, t + 1 / 60) - offset) < 0.31,
      "Small smooth frame-to-frame motion",
    );
  }
}
assert.notEqual(cometTailOffset(20, 0), cometTailOffset(20, 0.5));
// Follow a crest for 0.1s: phase velocity is -22 * 4.5 pixels/second.
const envelope = (x) => ((144 - x) / 144) ** 1.6;
assert(
  Math.abs(
    cometTailOffset(80, 0) / envelope(80) -
      cometTailOffset(70.1, 0.1) / envelope(70.1),
  ) < 1e-10,
);
assert(
  !css.includes("skewY") && !css.includes("scale("),
  "No elastic CSS stretching",
);
assert(css.includes("prefers-reduced-motion"));
console.log(
  "Anchored nucleus, outward ripple, smoothness and reduced-motion checks passed",
);
