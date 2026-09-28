import { performance } from "node:perf_hooks";
import { spherePixels, paintPlanet } from "../src/lib/pixel-planets.ts";
import { createCometFlight, recordCometTrail, drawCometFire } from "../src/lib/comet-flight.ts";
import { stepGravity, PHYSICS_STEP } from "../src/lib/gravity.ts";

const pixels = spherePixels(96);
const texture = new Uint8ClampedArray(384 * 192 * 4).fill(180);
const output = new Uint8ClampedArray(96 * 96 * 4);
const flights = Array.from({ length: 6 }, () => createCometFlight(1400, 800, () => 0.4));
for (let i = 0; i < 240; i++) for (const flight of flights) {
  stepGravity([flight.body], PHYSICS_STEP);
  flight.age += PHYSICS_STEP;
  recordCometTrail(flight);
}
const context = { globalAlpha: 1, globalCompositeOperation: "source-over", fillStyle: "", fillRect() {} };
function medianMsPerFrame(render) {
  const runs = [];
  for (let run = 0; run < 7; run++) {
    const start = performance.now();
    for (let frame = 0; frame < 600; frame++) render(frame);
    if (run) runs.push((performance.now() - start) / 600);
  }
  return runs.sort((a, b) => a - b)[Math.floor(runs.length / 2)];
}
console.log(JSON.stringify({
  planetCpuMsPerFrame: medianMsPerFrame((frame) => {
    for (let i = 0; i < 6; i++) paintPlanet(output, texture, 384, 192, pixels, frame / 3600);
  }),
  cometCpuMsPerFrame: medianMsPerFrame(() => {
    for (const flight of flights) drawCometFire(context, flight, flight.age, 1);
  }),
  note: "CPU-only six-body render microbenchmark; excludes browser layout, painting and GPU costs",
}, null, 2));
