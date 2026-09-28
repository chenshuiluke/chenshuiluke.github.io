import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const assets = ["moon-silver-map", "planet-gold-map", "planet-jade-map", "planet-lava-map", "planet-ocean-map", "comet-pixel"];
await mkdir(new URL("../public/space/", import.meta.url), { recursive: true });
for (const name of assets) {
  const comet = name === "comet-pixel";
  await sharp(fileURLToPath(new URL(`../public/${name}.webp`, import.meta.url)))
    .resize(comet ? 192 : 384, comet ? 64 : 192, { kernel: "nearest" })
    .webp({ lossless: true })
    .toFile(fileURLToPath(new URL(`../public/space/${name}.webp`, import.meta.url)));
}
console.log("Prepared lossless space textures at their actual canvas resolutions");
