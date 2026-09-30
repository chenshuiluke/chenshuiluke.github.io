import assert from "node:assert/strict";
import { createTidalStream, crossedHorizon, drawTidalStream, growBlackHole, HORIZON, HOLE_WIDTH, HOLE_HEIGHT, MAX_RADIUS, paintBlackHole, pullIntoHole, respawnPlanet, START_RADIUS, stepTidalStream, tidalShape } from "../src/lib/black-hole.ts";
import { PHYSICS_STEP } from "../src/lib/gravity.ts";

const hole = { x: 0, y: 0, strength: 1 };
const makeBody = (mass = 200) => ({ x: 450, y: 60, vx: 0, vy: 100, mass });
const distant = makeBody();
pullIntoHole(distant, hole, 1);
assert.deepEqual(distant, makeBody(), "The black hole no longer reaches across the whole page");
const probe = { ...makeBody(), x: 200, y: 0, vy: 0 };
pullIntoHole(probe, hole, PHYSICS_STEP);
assert(Math.abs(probe.vx) > 5.5 && Math.abs(probe.vx) < 6, "Midrange gravity has a strong pull rather than being erased by squared falloff");
const approaching = { ...makeBody(), x: 200, y: 0, vy: 30 };
let approachCaptured = false;
for (let i = 0; i < 180; i++) {
  const { x, y } = approaching;
  const smallHole = { ...hole, radius: START_RADIUS };
  pullIntoHole(approaching, smallHole, PHYSICS_STEP);
  approaching.x += approaching.vx * PHYSICS_STEP; approaching.y += approaching.vy * PHYSICS_STEP;
  if (crossedHorizon(x, y, approaching, smallHole)) { approachCaptured = true; break; }
}
assert(approachCaptured, "Even the starting hole captures a slow body 200px away within 1.5 seconds");
const flyby = { ...makeBody(), x: 300, y: -100, vy: 300 };
for (let i = 0; i < 120 * 4; i++) {
  const { x, y } = flyby;
  pullIntoHole(flyby, hole, PHYSICS_STEP);
  flyby.x += flyby.vx * PHYSICS_STEP; flyby.y += flyby.vy * PHYSICS_STEP;
  assert(!crossedHorizon(x, y, flyby, hole), "Fast, wider flybys can still pass without being consumed");
}
assert(Math.hypot(flyby.x, flyby.y) > 400 && flyby.x * flyby.vx + flyby.y * flyby.vy > 0, "Passing objects bend around the hole and escape its influence heading outward");
assert.equal(tidalShape({ ...makeBody(), x: 150, y: 0 }, hole).amount, 0, "Tearing only begins near the core");
assert(tidalShape({ ...makeBody(), x: 180, y: 0 }, hole, 100).amount > .18, "Large planets start tearing at their near surface before their centers overlap the hole");
for (const mass of [.15, 200, 2000]) {
  const body = { ...makeBody(mass), x: 90, y: 0, vy: 20 };
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
  assert(captured, `A close ${mass}-mass body can still be swallowed within four seconds`);
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
assert(growing.radius >= START_RADIUS * 1.12, "Even one comet makes the starting black hole visibly larger");
const cometGrowth = growing.radius - START_RADIUS;
growing.radius = START_RADIUS;
growBlackHole(growing, 200);
assert(growing.radius - START_RADIUS > cometGrowth, "Planets add more size than comets");
assert(growing.radius >= START_RADIUS * 1.3, "One planet visibly enlarges the starting hole by at least 30 percent");
for (let i = 0; i < 2; i++) growBlackHole(growing, 200);
assert(growing.radius >= START_RADIUS * 2, "Three planets roughly double the initial visual size");
for (let i = 0; i < 1000; i++) growBlackHole(growing, 200);
assert.equal(growing.radius, MAX_RADIUS, "Growth has a hard cap");
assert(crossedHorizon(24, 0, { ...makeBody(), x: 24, y: 0 }, growing));
assert(!crossedHorizon(24, 0, { ...makeBody(), x: 24, y: 0 }, { ...hole, radius: START_RADIUS }), "Capture radius grows with the visual horizon");
const stream = createTidalStream({ x: 180, y: 0, vx: -30, vy: 40, mass: 200 }, hole, 100);
for (let i = 0; i < 12; i++) stepTidalStream(stream, hole, PHYSICS_STEP);
assert(Math.abs(stream.fragments.at(-1).vx) > Math.abs(stream.fragments[0].vx) * 1.5, "The nearer hemisphere accelerates faster, creating differential stretch");
const draws = [];
drawTidalStream({ save() {}, restore() {}, translate() {}, rotate() {}, drawImage: (...args) => draws.push(args) }, { width: 96, height: 96 }, stream, hole);
assert(draws.length > 0 && draws.length <= 64);
assert(draws.every((args) => args.slice(1).every(Number.isFinite)), "Textured strips have finite geometry");
const large = createTidalStream({ x: -180, y: 0, vx: 0, vy: 20, mass: 200 }, hole, 240);
large.fragments.slice(10).forEach((fragment) => { fragment.swallowed = true; });
const geometry = [];
const recorder = { save() {}, restore() {}, translate: (...args) => geometry.push(["position", ...args]), rotate: (angle) => geometry.push(["angle", angle]),
  drawImage: (_image, ...args) => geometry.push(["texture", ...args]) };
drawTidalStream(recorder, { width: 96, height: 96 }, large, hole);
const beforeStaleMove = JSON.stringify(geometry);
large.fragments.slice(10).forEach((fragment) => { fragment.x = 900; fragment.y = -900; });
geometry.length = 0;
drawTidalStream(recorder, { width: 96, height: 96 }, large, hole);
assert.equal(JSON.stringify(geometry), beforeStaleMove, "Swallowed fragments cannot rotate or stretch surviving terrain into bars");
for (const draw of geometry.filter(([kind]) => kind === "texture")) {
  assert(draw[7] <= large.diameter / 16 * 1.5 + .71, "Texture segments stay short instead of bridging debris with giant rectangles");
  assert(draw[8] <= large.diameter, "Compression never inflates slices beyond the original planet");
}
const overlapping = createTidalStream({ x: -60, y: 0, vx: 0, vy: 0, mass: 200 }, hole, 240);
assert(overlapping.fragments.some((fragment) => fragment.swallowed));
assert(overlapping.fragments.filter((fragment) => !fragment.swallowed).every((fragment) => fragment.x < -HORIZON), "A large planet never seeds a second stream on the far side of the hole");
let leadingFirst = false;
for (let i = 0; i < 360; i++) {
  stepTidalStream(stream, hole, PHYSICS_STEP);
  if (stream.fragments.at(-1).swallowed && !stream.fragments[0].swallowed) leadingFirst = true;
}
assert(leadingFirst, "Leading material disappears before the trailing hemisphere");
assert(stream.fragments.every((fragment) => fragment.swallowed), "The entire stream is eventually consumed");
console.log("Black-hole attraction, swept capture, tidal stretch, replenishment and pixel animation checks passed");
