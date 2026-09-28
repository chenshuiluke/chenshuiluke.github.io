import assert from "node:assert/strict";
import { accelerations, stepGravity, seedOrbits, GRAVITY, SOFTENING, PHYSICS_STEP } from "../src/lib/gravity.ts";

const body = (x, y, mass, vx = 0, vy = 0) => ({ x, y, mass, vx, vy });
const pair = [body(-100, 0, 200), body(100, 0, 800)];
const a = accelerations(pair);
assert(a[0].x > 0 && a[1].x < 0, "Bodies attract one another");
assert(Math.abs(a[0].x / -a[1].x - 4) < 1e-12, "Acceleration responds to mass");
assert(Math.abs(a[0].x * 200 + a[1].x * 800) < 1e-10, "Equal and opposite forces");
seedOrbits(pair);
const energy = (bodies) => {
  let total = bodies.reduce((sum, b) => sum + b.mass * (b.vx ** 2 + b.vy ** 2) / 2, 0);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++)
    total -= GRAVITY * bodies[i].mass * bodies[j].mass / Math.sqrt((bodies[i].x - bodies[j].x) ** 2 + (bodies[i].y - bodies[j].y) ** 2 + SOFTENING ** 2);
  return total;
};
const initial = energy(pair);
for (let tick = 0; tick < 120 * 180; tick++) stepGravity(pair, PHYSICS_STEP);
assert(Math.abs(Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) - 200) < 0.1, "Binary bodies complete bound orbits rather than escaping");
assert(Math.abs((energy(pair) - initial) / initial) < 0.001, "Three-minute orbit conserves energy within 0.1%");
assert(Math.abs(pair.reduce((sum, b) => sum + b.mass * b.vx, 0)) < 1e-7, "Momentum is conserved");
assert(Math.abs(pair.reduce((sum, b) => sum + b.mass * b.vy, 0)) < 1e-7);
const encounter = [body(0, 0, 2000), body(-400, 80, 0.15, 180, 0)];
for (let tick = 0; tick < 120 * 4; tick++) stepGravity(encounter, PHYSICS_STEP);
assert(Math.abs(encounter[1].vy) > 5, "A flyby bends the comet's actual velocity");
assert(Math.hypot(encounter[0].vx, encounter[0].vy) > 0, "The comet also pulls on the planet");
const mobileFlyby = [body(0, 0, 250), body(-400, 80, 0.15, 120, 0)];
for (let tick = 0; tick < 120 * 8; tick++) stepGravity(mobileFlyby, PHYSICS_STEP);
const bend = Math.abs(Math.atan2(mobileFlyby[1].vy, mobileFlyby[1].vx) * 180 / Math.PI);
assert(bend > 20, "A mobile-sized planet visibly bends a typical comet by over 20 degrees");
const coincident = [body(0, 0, 1000), body(0, 0, 1000)];
stepGravity(coincident, PHYSICS_STEP);
assert(coincident.every((b) => Object.values(b).every(Number.isFinite)), "Close encounters never divide by zero");
console.log("Gravity attraction, mass response, momentum, orbital energy and close-encounter checks passed");
