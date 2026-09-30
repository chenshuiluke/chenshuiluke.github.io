import assert from "node:assert/strict";
import { createUfo, steerUfo, fireAntimatter, drawAntimatter, paintUfo, drawUfo, UFO_WIDTH, UFO_HEIGHT } from "../src/lib/ufos.ts";
import { PHYSICS_STEP, stepGravity } from "../src/lib/gravity.ts";
import { pullIntoHole, crossedHorizon, stepAntimatter, drawBlackHoleDamage } from "../src/lib/black-hole.ts";
import { avatarReaction } from "../src/lib/avatar-reaction.ts";

const gunner = createUfo(0, 1440, 844, 0, () => .5);
Object.assign(gunner, { delay: 0, weaponCooldown: 0 });
Object.assign(gunner.body, { x: 250, y: 0 });
const target = { x: 0, y: 0, radius: 26, strength: 1 };
assert.equal(fireAntimatter(gunner, { ...target, strength: 0 }), null);
const missile = fireAntimatter(gunner, target);
assert(missile, "Active nearby holes can be targeted");
assert.equal(fireAntimatter(gunner, target), null, "Cooldown prevents spam");
for (let i = 0; i < 7 * 120; i++) {
  steerUfo(gunner, PHYSICS_STEP, 1440, 844, 0, target, () => .5);
  assert.equal(fireAntimatter(gunner, target), null, "Pilots cannot fire again during the first seven seconds");
}
steerUfo(gunner, 1.1, 1440, 844, 0, target, () => .5);
assert(fireAntimatter(gunner, target), "Individual weapons eventually recharge");
let hits = 0;
for (let i = 0; i < 360; i++) {
  if (i < 15) target.y += 1;
  if (stepAntimatter(missile, target, PHYSICS_STEP)) hits++;
}
assert.equal(hits, 1, "Homing missile hits a moving hole exactly once");
assert.equal(target.radius, 26 * .92, "Impact removes only eight percent of the hole's radius");
const turning = { body: { x: 0, y: 0, vx: 600, vy: 0, mass: 0 }, age: 0, hit: false };
stepAntimatter(turning, { x: 1000, y: 1000, strength: 1, radius: 9 }, .1);
assert(Math.abs(Math.atan2(turning.body.vy, turning.body.vx) - Math.PI / 30) < 1e-8, "Guidance turns at most six degrees in a tenth of a second");
const overshot = { body: { x: 0, y: 0, vx: 600, vy: 0, mass: 0 }, age: 0, hit: false };
stepAntimatter(overshot, { x: -1000, y: 100, strength: 1, radius: 9 }, .1);
assert.equal(overshot.body.vx, 600); assert.equal(overshot.body.vy, 0, "Missiles don't turn around to chase targets behind them");
const expiredGuidance = { body: { x: 0, y: 0, vx: 600, vy: 0, mass: 0 }, age: 1, hit: false };
stepAntimatter(expiredGuidance, { x: 1000, y: 500, strength: 1, radius: 9 }, .1);
assert.equal(expiredGuidance.body.vy, 0, "After one second the missile stops actively tracking");
gunner.weaponCooldown = 0;
const dodgedHole = { x: 0, y: 0, strength: 1, radius: 18 };
const dodgedMissile = fireAntimatter(gunner, dodgedHole);
for (let i = 0; i < 360; i++) {
  if (i === 10) dodgedHole.y = 350;
  stepAntimatter(dodgedMissile, dodgedHole, PHYSICS_STEP);
}
assert(!dodgedMissile.hit && dodgedHole.radius === 18, "A sharp sideways dodge can miss for the entire projectile lifetime");
for (let i = 0; i < 40; i++) stepAntimatter({ body: { x: target.x, y: target.y, vx: 0, vy: 0, mass: 0 }, age: 0, hit: false }, target, PHYSICS_STEP);
assert.equal(target.radius, 4, "Repeated hits leave a small, nonzero black hole");
const lost = { body: { x: 0, y: 0, vx: 600, vy: 0, mass: 0 }, age: 0, hit: false };
assert.equal(stepAntimatter(lost, { ...target, strength: 0 }, PHYSICS_STEP), false, "Inactive holes cannot take damage");
const pixelsDrawn = [];
const drawContext = { save() {}, restore() {}, translate() {}, rotate() {}, fillRect: (...args) => pixelsDrawn.push(args) };
drawAntimatter(drawContext, lost, .1);
drawAntimatter(drawContext, { ...missile, age: .15 }, .1);
drawBlackHoleDamage(drawContext, .1);
assert(pixelsDrawn.length > 40 && pixelsDrawn.flat().every(Number.isFinite), "Missiles and damage have pixel-art feedback");
const count = pixelsDrawn.length;
drawBlackHoleDamage(drawContext, 1);
assert.equal(pixelsDrawn.length, count, "Damage effects expire");
assert.deepEqual(avatarReaction({ ...target, strength: 0 }, 0, 0), { x: 0, y: 0, mood: "" });
assert.equal(avatarReaction({ ...target, x: 500, y: 0 }, 0, 0).x, 18);
assert.equal(avatarReaction({ ...target, x: -500, y: 0 }, 0, 0).x, -18);
assert.equal(avatarReaction({ ...target, x: 0, y: 500 }, 0, 0).y, 12);
assert.equal(avatarReaction({ ...target, x: 0, y: 0 }, 0, 0).mood, "worried");
assert.equal(avatarReaction({ ...target, x: 150, y: 0 }, 0, 0, true).mood, "worried");
assert.equal(avatarReaction({ ...target, x: 150, y: 0 }, 0, 0, false).mood, "watching");

const dormant = { x: 0, y: 0, strength: 0, radius: 9 };
for (const width of [390, 1440]) {
  const ufo = createUfo(0, width, 844, 1500, () => .5);
  const start = { ...ufo.body };
  for (let i = 0; i < 120 * 6; i++) {
    steerUfo(ufo, PHYSICS_STEP, width, 844, 1500, dormant, () => .5);
    stepGravity([ufo.body], PHYSICS_STEP);
  }
  assert(Object.values(ufo.body).every(Number.isFinite));
  assert(Math.hypot(ufo.body.x - start.x, ufo.body.y - start.y) > 80, "Ships roam instead of staying still");
  assert(ufo.targetY >= 1500 && ufo.targetY <= 2344, "Waypoints follow the scrolled viewport");
}
const endangered = createUfo(1, 390, 844, 0, () => .5);
const hole = { x: endangered.body.x - 90, y: endangered.body.y, strength: 1, radius: 18 };
endangered.body.vx = endangered.body.vy = 0;
endangered.fuel = 0;
steerUfo(endangered, PHYSICS_STEP, 390, 844, 0, hole, () => .5);
assert(endangered.panic && endangered.body.vx > 0, "Pilots panic and thrust away from a nearby hole");
let swallowed = false;
for (let i = 0; i < 240; i++) {
  const { x, y } = endangered.body;
  steerUfo(endangered, PHYSICS_STEP, 390, 844, 0, hole, () => .5);
  pullIntoHole(endangered.body, hole, PHYSICS_STEP);
  stepGravity([endangered.body], PHYSICS_STEP);
  if (crossedHorizon(x, y, endangered.body, hole)) { swallowed = true; break; }
}
assert(swallowed, "An exhausted pilot can still be caught close to the core");
for (const radius of [9, 18]) {
  const pilot = createUfo(0, 1440, 844, 0, () => .5);
  Object.assign(pilot.body, { x: 210, y: 0, vx: -30, vy: 20 });
  const threat = { x: 0, y: 0, strength: 1, radius };
  let escaped = false;
  for (let i = 0; i < 600; i++) {
    const { x, y } = pilot.body;
    steerUfo(pilot, PHYSICS_STEP, 1440, 844, 0, threat, () => .5);
    pullIntoHole(pilot.body, threat, PHYSICS_STEP);
    stepGravity([pilot.body], PHYSICS_STEP);
    assert(!crossedHorizon(x, y, pilot.body, threat), "Charged pilots can reverse an incoming trajectory");
    if (Math.hypot(pilot.body.x, pilot.body.y) > 440) { escaped = true; break; }
  }
  assert(escaped, `Boost escapes a radius-${radius} hole from a recoverable approach`);
  assert(pilot.fuel < 1 && pilot.fuel >= 0, "Escape consumes a bounded fuel reserve");
  for (let i = 0; i < 120 * 7; i++) steerUfo(pilot, PHYSICS_STEP, 1440, 844, 0, dormant, () => .5);
  assert.equal(pilot.fuel, 1, "Fuel recharges away from danger");
  assert(!pilot.boosting);
}

// A close approach to a full-size hole stays dangerous even with counterfire.
for (const armed of [false, true]) {
  const pilot = createUfo(0, 1440, 844, 0, () => .5);
  pilot.delay = 0;
  Object.assign(pilot.body, { x: 210, y: 0, vx: -30, vy: 20 });
  const threat = { x: 0, y: 0, strength: 1, radius: 26 }, missiles = [];
  let captured = false;
  for (let i = 0; i < 960; i++) {
    const { x, y } = pilot.body;
    steerUfo(pilot, PHYSICS_STEP, 1440, 844, 0, threat, () => .5);
    if (armed) {
      const missile = fireAntimatter(pilot, threat);
      if (missile) missiles.push(missile);
    }
    for (const missile of missiles) stepAntimatter(missile, threat, PHYSICS_STEP);
    pullIntoHole(pilot.body, threat, PHYSICS_STEP);
    stepGravity([pilot.body], PHYSICS_STEP);
    if (crossedHorizon(x, y, pilot.body, threat)) { captured = true; break; }
  }
  assert(captured, "Neither boost nor a single missile guarantees escape from a close approach");
  if (armed) assert.equal(threat.radius, 26 * .92, "Counterfire chips the hole without neutralizing its pull");
}

const sprites = [];
for (let kind = 0; kind < 3; kind++) {
  const frames = [];
  for (let frame = 0; frame < 10; frame++) {
    const pixels = new Uint8ClampedArray(UFO_WIDTH * UFO_HEIGHT * 4);
    paintUfo(pixels, kind, frame);
    assert.equal(pixels[3], 0, "Sprite corners are transparent");
    assert(pixels.filter((value, i) => i % 4 === 3 && value).length > 200, "Compact, opaque silhouettes remain readable at native size");
    frames.push(pixels);
  }
  assert.notDeepEqual(frames[0], frames[7], "Pilots blink");
  assert.notDeepEqual(frames[0], frames[8], "Panic changes faces and running lights");
  sprites.push(frames);
}
assert.notDeepEqual(sprites[0][0], sprites[1][0]);
assert.notDeepEqual(sprites[1][0], sprites[2][0], "Each pilot has its own silhouette and palette");
for (const viewport of [390, 541, 960, 1440, 1920]) {
  const draws = [];
  drawUfo({ save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillRect() {}, drawImage: (...args) => draws.push(args) }, {}, endangered, 1, viewport);
  const smallestCometHead = Math.max(140, Math.min(240, viewport * .17)) * .2;
  assert(draws[0][7] >= UFO_WIDTH, "Small-screen artwork is never downsampled, so its eyes and outline survive");
  assert(draws[0][7] < smallestCometHead, "UFOs remain smaller than even the small comet heads");
  assert(draws[0].slice(1).every(Number.isFinite));
}
console.log("UFO roaming, scroll coordinates, panic, black-hole capture and character animation checks passed");

// Optional nearest-neighbor contact sheet for reviewing the actual canvas artwork.
if (process.argv[2]) {
  const width = UFO_WIDTH * 3, height = UFO_HEIGHT * 2;
  const sheet = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < sheet.length; i += 4) sheet.set([12, 19, 36, 255], i);
  for (let row = 0; row < 2; row++) for (let kind = 0; kind < 3; kind++) {
    const sprite = sprites[kind][row ? 8 : 2];
    for (let y = 0; y < UFO_HEIGHT; y++) for (let x = 0; x < UFO_WIDTH; x++) {
      const source = (y * UFO_WIDTH + x) * 4;
      if (sprite[source + 3]) sheet.set(sprite.subarray(source, source + 4), ((row * UFO_HEIGHT + y) * width + kind * UFO_WIDTH + x) * 4);
    }
  }
  const { default: sharp } = await import("sharp");
  await sharp(sheet, { raw: { width, height, channels: 4 } }).png().toFile(process.argv[2].replace(/\.png$/, "-native.png"));
  await sharp(sheet, { raw: { width, height, channels: 4 } }).resize(width * 4, height * 4, { kernel: "nearest" }).png().toFile(process.argv[2]);
}
