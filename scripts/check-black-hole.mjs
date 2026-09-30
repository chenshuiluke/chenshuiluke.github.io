import assert from "node:assert/strict";
import { createTidalStream, crossedHorizon, drawTidalStream, growBlackHole, HORIZON, HOLE_WIDTH, HOLE_HEIGHT, MAX_RADIUS, paintBlackHole, pullIntoHole, respawnPlanet, START_RADIUS, stepTidalStream, tidalShape } from "../src/lib/black-hole.ts";
import { PHYSICS_STEP } from "../src/lib/gravity.ts";

const hole = { x: 0, y: 0, strength: 1 };
const makeBody = (mass = 200) => ({ x: 450, y: 60, vx: 0, vy: 100, mass });
for (const mass of [.15, 200, 2000]) {
  const body = makeBody(mass);
  let captured = false;
  for (let i = 0; i < 120 * 4; i++) {
    const { x, y } = body;
    pullIntoHole(body, hole, PHYSICS_STEP);
    body.x += body.vx * PHYSICS_STEP;
    body.y += body.vy * PHYSICS_STEP;
    assert(Object.values(body).every(Number.isFinite));
    assert(Math.hypot(body.vx, body.vy) <= 1500.000001);
    if (crossedHorizon(x, y, body, hole)) { captured = true; break; }
  }
  assert(captured, `A ${mass}-mass body is swallowed within four seconds`);
}
assert(crossedHorizon(-100, 0, { ...makeBody(), x: 100, y: 0 }, hole), "Swept capture catches a high-speed crossing");
assert(!crossedHorizon(-100, 50, { ...makeBody(), x: 100, y: 50 }, hole), "Flybys outside the horizon aren't swallowed");
const still = makeBody();
pullIntoHole(still, { ...hole, strength: 0 }, 1);
assert.deepEqual(still, makeBody(), "Inactive holes don't change gravity");
const near = tidalShape({ ...still, x: HORIZON + 5, y: 0 }, hole);
const far = tidalShape(still, hole);
assert(near.stretch > 4 && near.squeeze < .25 && near.opacity < 1, "Tidal force stretches, compresses and consumes the body");
assert.equal(far.stretch, 1); assert.equal(far.squeeze, 1); assert.equal(far.opacity, 1);
for (const edge of [.01, .26, .51, .76]) {
  respawnPlanet(still, 390, 844, 1000, () => edge);
  assert(still.x < 0 || still.x > 390 || still.y < 1000 || still.y > 1844);
  assert((195 - still.x) * still.vx + (1422 - still.y) * still.vy > 0, "Replenished planets enter the current viewport");
}
const frame = new Uint8ClampedArray(HOLE_WIDTH * HOLE_HEIGHT * 4);
paintBlackHole(frame, 0);
const first = frame.slice();
assert.equal(frame[3], 0, "Sprite corners stay transparent");
const center = ((HOLE_HEIGHT / 2) * HOLE_WIDTH + HOLE_WIDTH / 2) * 4;
assert(frame[center] < 10 && frame[center + 3] === 255, "Event horizon is opaque black");
paintBlackHole(frame, .25);
assert.notDeepEqual(frame, first, "Accretion texture rotates");
const growing = { ...hole, radius: START_RADIUS };
growBlackHole(growing, .15);
assert(growing.radius > START_RADIUS, "Even one comet grows the black hole");
const cometGrowth = growing.radius - START_RADIUS;
growing.radius = START_RADIUS;
growBlackHole(growing, 200);
assert(growing.radius - START_RADIUS > cometGrowth, "Planets add more size than comets");
for (let i = 0; i < 1000; i++) growBlackHole(growing, 200);
assert.equal(growing.radius, MAX_RADIUS, "Growth has a hard cap");
assert(crossedHorizon(24, 0, { ...makeBody(), x: 24, y: 0 }, growing));
assert(!crossedHorizon(24, 0, { ...makeBody(), x: 24, y: 0 }, { ...hole, radius: START_RADIUS }), "Capture radius grows with the visual horizon");
const stream = createTidalStream({ x: 180, y: 0, vx: -30, vy: 40, mass: 200 }, hole, 100);
for (let i = 0; i < 12; i++) stepTidalStream(stream, hole, PHYSICS_STEP);
assert(Math.abs(stream.fragments.at(-1).vx) > Math.abs(stream.fragments[0].vx) * 1.5, "The nearer hemisphere accelerates faster, creating differential stretch");
const draws = [];
drawTidalStream({ save() {}, restore() {}, translate() {}, rotate() {}, drawImage: (...args) => draws.push(args) }, { width: 96, height: 96 }, stream, hole);
assert(draws.length > 0 && draws.length <= 12);
assert(draws.every((args) => args.slice(1).every(Number.isFinite)), "Textured strips have finite geometry");
let leadingFirst = false;
for (let i = 0; i < 360; i++) {
  stepTidalStream(stream, hole, PHYSICS_STEP);
  if (stream.fragments.at(-1).swallowed && !stream.fragments[0].swallowed) leadingFirst = true;
}
assert(leadingFirst, "Leading material disappears before the trailing hemisphere");
assert(stream.fragments.every((fragment) => fragment.swallowed), "The entire stream is eventually consumed");
console.log("Black-hole attraction, swept capture, tidal stretch, replenishment and pixel animation checks passed");
