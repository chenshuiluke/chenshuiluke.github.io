import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import config from "../velite.config.ts";
import * as blackHole from "../src/lib/black-hole.ts";
import * as ufoHelpers from "../src/lib/ufos.ts";
import { avatarReaction } from "../src/lib/avatar-reaction.ts";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
// Exercise the real TSX exports without booting Next or adding a test framework.
function load(path, mocks = {}, globals = {}) {
  const source = read(path).replaceAll("import.meta.url", JSON.stringify(new URL(`../${path}`, import.meta.url).href));
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const compiled = { exports: {} };
  runInNewContext(`(function(require, module, exports) {${code}\n})`, globals)(
    (id) => mocks[id] ?? (id.endsWith(".css") || id.startsWith("@/") ? {} : require(id)),
    compiled, compiled.exports,
  );
  return compiled.exports;
}

const { GravityText } = load("src/components/GravityText/GravityText.tsx");
const sampleText = "Hello, I'm Luke.  Pixel art!";
const textMarkup = renderToStaticMarkup(GravityText({ children: sampleText }));
assert.equal(textMarkup.replace(/<[^>]+>/g, "").replaceAll("&#x27;", "'"), sampleText, "Word spans preserve readable, selectable text and whitespace");
const lens = { x: 0, y: 0, radius: 18, strength: 1 };
assert.deepEqual(blackHole.textBulge({ ...lens, strength: 0 }, 50, 50), { x: 0, y: 0, scale: 1 });
assert.equal(blackHole.textBulge(lens, 500, 0).scale, 1, "Distant text stays untouched");
assert(blackHole.textBulge(lens, -80, 0).x > 0 && blackHole.textBulge(lens, 80, 0).x < 0, "Text leans toward, not away from, the hole");
for (let x = -250; x <= 250; x += 10) {
  const bulge = blackHole.textBulge(lens, x, 0);
  assert(Object.values(bulge).every(Number.isFinite));
  assert(Math.abs(bulge.x) <= 7 && bulge.scale >= 1 && bulge.scale <= 1.055, "Bulging stays subtle even at the center");
}

const published = { title: "Published", slug: "published", permalink: "/blog/published", summary: "Public post", date: "2026-01-01", tags: ["machine learning", "café", "100%"], draft: false };
const draft = { ...published, title: "Secret draft", slug: "secret", permalink: "/blog/secret", draft: true, tags: ["draft-only"] };

// Homepage previews use real published posts; rotating them must not add a frame loop.
{
  const previewPosts = [published, { ...published, title: "Newer", date: "2026-02-01", permalink: "/blog/newer" }, draft];
  const { RecentPosts } = load("src/components/RecentPosts/RecentPosts.tsx", {
    "@/content": { posts: previewPosts }, "./PostHighlights": { PostHighlights: () => null },
  });
  assert.equal(JSON.stringify(RecentPosts().props.posts.map((p) => p.title)), JSON.stringify(["Newer", "Published"]));
  assert.equal(load("src/components/RecentPosts/RecentPosts.tsx", {
    "@/content": { posts: [] }, "./PostHighlights": { PostHighlights: () => null },
  }).RecentPosts(), null);
  const slots = [];
  let cursor, runEffect, cleanup, tick;
  const handlers = new Map();
  const motion = { matches: false, addEventListener: (_, fn) => handlers.set("motion", fn), removeEventListener: () => handlers.delete("motion") };
  const page = { hidden: false, addEventListener: (_, fn) => handlers.set("visibility", fn), removeEventListener: () => handlers.delete("visibility") };
  const { PostHighlights } = load("src/components/RecentPosts/PostHighlights.tsx", {
    "@/components/GravityText/GravityText": { GravityText },
    react: {
      useState: (initial) => {
        const slot = cursor++;
        if (slots[slot] === undefined) slots[slot] = initial;
        return [slots[slot], (value) => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
      },
      useEffect: (fn) => { runEffect = fn; },
    },
  }, {
    window: { matchMedia: () => motion }, document: page,
    setInterval: (fn, ms) => { assert.equal(ms, 8000); tick = fn; return 1; },
    clearInterval: () => { tick = undefined; },
  });
  const render = (posts = previewPosts.slice(0, 2)) => {
    cleanup?.(); cursor = 0;
    const tree = PostHighlights({ posts }); cleanup = runEffect(); return tree;
  };
  let tree = render();
  tick(); assert.equal(slots[0], 1);
  tick(); assert.equal(slots[0], 0, "Autoplay wraps");
  tree.props.onMouseEnter(); render(); assert.equal(tick, undefined, "Hover pauses previews");
  tree.props.onMouseLeave(); tree = render(); assert.equal(typeof tick, "function");
  tree.props.onFocusCapture(); render(); assert.equal(tick, undefined, "Focus prevents replacing a focused link");
  tree.props.onBlurCapture({ currentTarget: { contains: () => false } }); tree = render();
  const controls = tree.props.children[2].props.children;
  controls[2].props.onClick(); assert.equal(slots[0], 1, "Previous wraps backwards");
  controls[3].props.onClick(); assert.equal(slots[0], 0, "Next wraps forwards");
  controls[0].props.onClick(); tree = render(); assert.equal(tick, undefined, "Explicit pause works");
  tree.props.children[2].props.children[0].props.onClick(); render();
  motion.matches = true; handlers.get("motion")(); assert.equal(tick, undefined);
  motion.matches = false; handlers.get("motion")(); assert.equal(typeof tick, "function");
  page.hidden = true; handlers.get("visibility")(); assert.equal(tick, undefined);
  page.hidden = false; handlers.get("visibility")(); assert.equal(typeof tick, "function");
  render([published]); assert.equal(tick, undefined, "Single post needs no timer");
  assert.equal(render([]), null); assert.equal(handlers.size, 0, "Listeners are cleaned up");
  assert(!read("src/app/page.tsx").includes("LIPSUM"));
  assert.match(read("src/components/Hero/Hero.tsx"), /href="mailto:chenshuiluke@gmail.com"/);
  console.log("Homepage content, preview navigation, pause, reduced-motion and hidden-tab checks passed");
}
const oldEnv = process.env.NODE_ENV;
try {
  process.env.NODE_ENV = "production";
  const data = { posts: [published, draft] };
  await config.prepare(data);
  assert.deepEqual(data.posts, [published], "Production generation excludes drafts");
  process.env.NODE_ENV = "development";
  const preview = { posts: [published, draft] };
  await config.prepare(preview);
  assert.equal(preview.posts.length, 2, "Local draft previews remain possible");
} finally {
  if (oldEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = oldEnv;
}
const originalCwd = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "portfolio-feed-test-"));
try {
  mkdirSync(join(scratch, "public"));
  process.chdir(scratch);
  await config.complete({ posts: [published, draft] });
  const rss = readFileSync(join(scratch, "public/rss.xml"), "utf8");
  assert(rss.includes("Published") && !rss.includes("Secret draft"), "RSS never exposes drafts");
} finally {
  process.chdir(originalCwd);
  rmSync(scratch, { recursive: true });
}

const tags = load("src/app/blog/tags/[tag]/page.tsx", { "@/content": { posts: [published, draft] } });
assert.equal(JSON.stringify(tags.generateStaticParams()), JSON.stringify(published.tags.map((tag) => ({ tag }))));
assert.equal((await tags.generateMetadata({ params: Promise.resolve({ tag: "100%" }) })).title, "#100% — Blog — Luke Chen Shui");
const { Mdx } = load("src/components/blog/Mdx.tsx");
for (const href of ["/blog", "#section", "relative-post", "mailto:test@example.com", "https://example.com", "//example.com"]) {
  const code = `return { default: ({components}) => arguments[0].jsx(components.a, {href: ${JSON.stringify(href)}, title: "Kept", "aria-label": "Accessible", children: "Link"}) }`;
  const html = renderToStaticMarkup(Mdx({ code }));
  assert(html.includes('title="Kept"') && html.includes('aria-label="Accessible"'));
  assert.equal(html.includes('target="_blank"'), /^(https?:)?\/\//.test(href), "Only external web links open another tab");
}
for (const path of ["Scene/Scene.tsx", "Comets/SpaceSimulation.tsx", "svg/PixelPlanet.tsx"])
  assert(!/SkyPaused|Pause space|Resume space/.test(read(`src/components/${path}`)), "Pause machinery is removed");
for (const name of ["AnimatedCard", "FloatingColumn"]) {
  const css = read(`src/components/${name}/${name}.module.css`);
  assert(/prefers-reduced-motion: reduce/.test(css) && /transform: none !important/.test(css));
}
console.log("Draft privacy, raw tag routes, MDX links, reduced motion and pause removal checks passed");
assert.match(read("src/components/ScrollChapter/ScrollChapter.module.css"), /@media \(max-width: 820px\), \(max-height: 600px\)[\s\S]*?height: auto/);

// Exercise the actual animation effects: off-screen/hidden work must stop and resume.
let effect, intersection;
const listeners = new Map();
const events = {
  addEventListener: (name, handler) => listeners.set(name, handler),
  removeEventListener: (name) => listeners.delete(name),
};
const decorations = [{ style: {} }, { style: {} }];
const document = { ...events, hidden: false, documentElement: { clientWidth: 390 } };
let disconnected = false;
const { Scene } = load("src/components/Scene/Scene.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: () => ({ current: { querySelectorAll: () => decorations } }) },
}, {
  document,
  IntersectionObserver: class {
    constructor(callback) { intersection = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  },
});
Scene({ children: null });
const cleanupScene = effect();
intersection(decorations.map((target, i) => ({ target, isIntersecting: i === 0 })));
assert.equal(decorations[0].style.animationPlayState, "running");
assert.equal(decorations[1].style.animationPlayState, "paused");
assert.equal(decorations[1].style.visibility, "hidden", "Off-screen decorations do not retain visible paint surfaces");
intersection([{ target: decorations[1], isIntersecting: true }]);
assert.equal(decorations[1].style.visibility, "", "Decorations reappear on entry");
document.hidden = true;
listeners.get("visibilitychange")();
assert(decorations.every((node) => node.style.animationPlayState === "paused"));
document.hidden = false;
listeners.get("visibilitychange")();
assert.equal(decorations[0].style.animationPlayState, "running");
cleanupScene();
assert(disconnected && listeners.size === 0);
assert(decorations.every((node) => node.style.animationPlayState === ""));
assert(decorations.every((node) => node.style.visibility === ""));

const frames = new Map();
const rectangles = [];
const images = [];
const constellationDraws = [];
let surfaces = 0;
const scenery = load("src/lib/space-scenery.ts", {}, {
  document: { createElement() {
    surfaces++;
    return { getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) };
  } },
});
const paintScenery = scenery.createScenery({
  drawImage(image, ...args) {
    images.push(args);
    if (image.width === 32) constellationDraws.push({ rect: args, alpha: this.globalAlpha });
  },
  beginPath() {}, arc() {}, fill() {},
}, true);
const cachedSurfaces = surfaces;
paintScenery(20, 390, 844, 12000, 0, false);
assert(images.length > 0 && images.length < 20, "Only visible scenery sprites are composited");
assert(images.flat().every(Number.isFinite));
const firstScenery = JSON.stringify(images);
images.length = 0;
paintScenery(25, 390, 844, 12000, 0, false);
assert.notEqual(JSON.stringify(images), firstScenery, "Nebulas still drift smoothly");
assert.equal(surfaces, cachedSurfaces, "Animated scenery never allocates fresh gradient canvases");
images.length = 0;
paintScenery(20, 390, 844, 12000, 0, true);
const staticScenery = JSON.stringify(images);
images.length = 0;
paintScenery(25, 390, 844, 12000, 0, true);
assert.equal(JSON.stringify(images), staticScenery, "Reduced motion keeps the background static");
paintScenery(20, 1440, 900, 12000, 0, false, 900);
assert.equal(constellationDraws.length, 13, "All original constellation stars remain on desktop");
assert.deepEqual(constellationDraws[0].rect, [69, 444, 32, 32], "Glows align with the static SVG paths");
constellationDraws.length = 0;
paintScenery(20, 390, 844, 12000, 0, true, 844);
assert.equal(constellationDraws.length, 4, "Mobile crops stars outside the widened constellation viewBox");
const frozenGlows = JSON.stringify(constellationDraws);
constellationDraws.length = 0;
paintScenery(25, 390, 844, 12000, 0, true, 844);
assert.equal(JSON.stringify(constellationDraws), frozenGlows);
constellationDraws.length = 0;
paintScenery(25, 390, 844, 12000, 900, false, 844);
assert.equal(constellationDraws.length, 0, "Off-screen hero stars skip all drawing");
assert.equal(surfaces, cachedSurfaces, "Star halos are baked once, including across resizes");
const heroSource = read("src/components/ChapterHero/ChapterHero.tsx");
assert(!heroSource.includes("<rect"), "Pulsing star filters are no longer SVG paint work");
assert.match(heroSource, /className=\{`\$\{styles\.aurora\} \$\{styles\.auroraCool\}`\}/);
assert.match(heroSource, /className=\{`\$\{styles\.aurora\} \$\{styles\.auroraWarm\}`\}/);
const context = { clearRect() { rectangles.length = 0; }, fillRect(...rect) { rectangles.push(rect); }, beginPath() {}, rect(...rect) { rectangles.push(rect); }, fill() {} };
const canvas = { getContext: () => context, closest: () => ({ offsetHeight: 12000 }) };
const motion = { ...events, matches: false };
let serial = 0;
const globals = {
  document, window: events, innerHeight: 844, scrollY: 0,
  performance: { now: () => 1000 },
  matchMedia: () => motion,
  getComputedStyle: () => ({ getPropertyValue: () => "#fff" }),
  requestAnimationFrame: (fn) => { frames.set(++serial, fn); return serial; },
  cancelAnimationFrame: (id) => frames.delete(id),
  ResizeObserver: class { observe() {} disconnect() {} },
};
let scrollReads = 0, scrollPosition = 0;
Object.defineProperty(globals, "scrollY", {
  get: () => { scrollReads++; return scrollPosition; },
  set: (value) => { scrollPosition = value; },
});
const { ParallaxStars } = load("src/components/ParallaxStars/ParallaxStars.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: () => ({ current: canvas }) },
  "@/lib/space-scenery": { ...scenery, createScenery: () => () => {} },
}, globals);
ParallaxStars({});
const cleanupStars = effect();
assert.equal(canvas.width, 390);
assert.equal(canvas.height, 844, "Star backing store stays viewport-sized, not 12000px tall");
assert(rectangles.length > 0 && rectangles.length < 70, "Only visible stars are painted, including batched dots and sparkles");
assert(rectangles.every(([, y, , height]) => y + height >= -24 && y <= canvas.height + 24));
assert.equal(frames.size, 1);
const readsAfterMount = scrollReads;
const [frameId, animate] = frames.entries().next().value;
frames.delete(frameId);
animate(1016);
assert.equal(scrollReads, readsAfterMount, "Rendering stars must not synchronously read layout/scroll state");
document.hidden = true;
listeners.get("visibilitychange")();
assert.equal(frames.size, 0, "Hidden tab stops star animation");
document.hidden = false;
motion.matches = true;
listeners.get("change")();
assert.equal(frames.size, 0, "Reduced motion draws once without scheduling animation");
const beforeScroll = JSON.stringify(rectangles);
globals.scrollY = 1600;
listeners.get("scroll")();
assert.notEqual(JSON.stringify(rectangles), beforeScroll, "Static stars still track scrolling");
motion.matches = false;
listeners.get("change")();
assert.equal(frames.size, 1, "Animation resumes without duplicate loops");
cleanupStars();
assert.equal(frames.size, 0);
assert.equal(listeners.size, 0);
for (const name of ["ChapterSky", "FloatingObject"])
  assert(!/^\s*filter:/m.test(read(`src/components/${name}/${name}.module.css`)), "Orbital anchors must not own filter surfaces");
console.log("Viewport star rendering, decoration culling, visibility cleanup and bounded filter checks passed");
const simulation = read("src/components/Comets/SpaceSimulation.tsx");
const animationLoop = simulation.slice(simulation.indexOf("const tick ="), simulation.indexOf("const sync ="));
assert(!/\bscrollY\b/.test(animationLoop), "Never read scrollY between planet/comet transform writes");

// Run the real simulation effect: culling must skip DOM writes, not gravity.
let transformWrites = 0, gravitySteps = 0, lastTransform = "";
const planetStyle = { visibility: "" };
const planetTexture = { width: 96, height: 96, dataset: { ready: "loading" } };
let stripDraws = 0, snapshots = 0;
document.createElement = () => ({ getContext: () => ({ translate() {}, rotate() {}, drawImage() { snapshots++; } }) });
Object.defineProperty(planetStyle, "translate", {
  get: () => lastTransform,
  set: (value) => { transformWrites++; lastTransform = value; },
});
const planet = {
  style: planetStyle,
  dataset: { planet: "jade" },
  querySelector: () => planetTexture,
  getBoundingClientRect: () => ({ x: 100, y: 100, width: 100, height: 100 }),
  closest: () => null,
};
const gazeTransforms = [];
const avatar = { dataset: {}, getBoundingClientRect: () => ({ x: 100, y: 80, width: 150, height: 150 }),
  querySelectorAll: () => [{ setAttribute: (_name, value) => gazeTransforms.push(value) }] };
let textReads = 0, changedText, textObserverDisconnected = false;
const word = { style: {}, getBoundingClientRect: () => { textReads++; return { x: 260, y: 380, width: 60, height: 20 }; } };
let words = [word];
const scene = { dataset: {}, offsetHeight: 4000, querySelectorAll: (selector) => selector === "[data-hole-text]" ? words : [planet], querySelector: () => avatar,
  addEventListener() {}, removeEventListener() {} };
const fireCanvas = {
  width: 390, height: 844, dataset: {}, closest: () => scene,
  getContext: () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {},
    drawImage: (_image, ...geometry) => { assert(geometry.every(Number.isFinite)); stripDraws++; } }),
};
let damageRects = 0;
const holeCanvas = { style: {}, getContext: () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, save() {}, restore() {}, fillRect() { damageRects++; } }) };
let simulationRefs = 0;
const simulatedUfos = [];
const missileLaunches = [];
let simulationNow = 0;
const pointerMedia = { matches: true };
let body;
const { SpaceSimulation } = load("src/components/Comets/SpaceSimulation.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: (initial) => ({ current: initial === null ? (++simulationRefs === 1 ? fireCanvas : holeCanvas) : initial }) },
  "@/lib/black-hole": blackHole,
  "@/lib/ufos": { ...ufoHelpers, fireAntimatter: (...args) => {
    const missile = ufoHelpers.fireAntimatter(...args);
    if (missile) missileLaunches.push(simulationNow);
    return missile;
  }, createUfoAtlas: () => null, createUfo: (...args) => {
    const ufo = ufoHelpers.createUfo(...args); simulatedUfos.push(ufo); return ufo;
  } },
  "@/lib/avatar-reaction": { avatarReaction },
  "@/components/svg/PixelSprite": { PixelSprite: () => null },
  "@/lib/gravity": {
    PHYSICS_STEP: 1 / 60,
    seedOrbits: (bodies) => { body = bodies[0]; },
    stepGravity: (bodies) => { if (bodies.includes(body)) gravitySteps++; },
  },
}, {
  ...globals,
  matchMedia: (query) => query.includes("pointer: coarse") ? pointerMedia : motion,
  ResizeObserver: class { observe() {} disconnect() {} },
  MutationObserver: class { constructor(callback) { changedText = callback; } observe() {} disconnect() { textObserverDisconnected = true; } },
});
SpaceSimulation();
const cleanupSimulation = effect();
const advance = (now) => {
  simulationNow = now;
  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback(now);
};
const cursorPosition = () => {
  const [, x, y] = holeCanvas.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  return [Number(x) + blackHole.HOLE_WIDTH, Number(y) + blackHole.HOLE_HEIGHT];
};
advance(1000);
assert.equal(holeCanvas.style.opacity, "1", "Mobile black holes appear on the very first frame");
const mobileStart = cursorPosition();
advance(1010);
assert.notDeepEqual(cursorPosition(), mobileStart, "Mobile wandering starts immediately without an idle delay");
pointerMedia.matches = false;
assert.equal(fireCanvas.dataset.ufoCount, "1", "Mobile keeps a single UFO");
body.x = -1000;
advance(1020);
assert.equal(planetStyle.visibility, "hidden");
const writesAfterExit = transformWrites;
advance(1040);
assert.equal(transformWrites, writesAfterExit, "Off-screen bodies do not update their DOM transforms");
assert(gravitySteps >= 2, "Off-screen bodies still participate in every gravity step");
body.x = 150;
advance(1060);
assert.equal(planetStyle.visibility, "", "Gravity bodies reappear on entry");
assert(transformWrites > writesAfterExit);
listeners.get("pointermove")({ pointerType: "mouse", clientX: 320, clientY: 400 });
advance(1080);
assert.equal(scene.dataset.blackHoleActive, "true", "Mouse replaces the cursor with a black hole");
assert.equal(holeCanvas.style.opacity, "1");
assert.equal(avatar.dataset.holeMood, "watching", "Avatar follows a distant black hole");
assert.match(word.style.transform, /scale\(1\.0/, "Nearby text bulges in the real animation loop");
assert.equal(textReads, 1, "Pointer movement doesn't trigger per-frame text layout reads");
assert(gazeTransforms.at(-1).startsWith("translate("));
listeners.get("pointerout")({ relatedTarget: null });
advance(1100);
assert.equal(holeCanvas.style.opacity, "0", "Leaving the page restores the cursor");
listeners.get("pointermove")({ pointerType: "touch", clientX: 320, clientY: 400 });
advance(1120);
assert.equal(holeCanvas.style.opacity, "0", "Touch doesn't create a mouse cursor");
const nextWord = { style: {}, getBoundingClientRect: word.getBoundingClientRect };
words = [nextWord]; changedText();
planetTexture.dataset.ready = "true";
listeners.get("pointermove")({ pointerType: "mouse", clientX: body.x + 60, clientY: body.y - globals.scrollY });
advance(1140);
assert.equal(textReads, 2, "Rotating blog excerpts refresh the cached word anchors");
assert.equal(snapshots, 1, "Disruption snapshots the real rotating planet texture once");
assert(stripDraws > 0, "The simulation renders the independent textured strips");
assert.equal(planetStyle.visibility, "hidden", "Strands replace the original planet rather than duplicating it");
listeners.get("pointermove")({ pointerType: "mouse", clientX: body.x, clientY: body.y - globals.scrollY });
advance(1200);
assert.equal(planetStyle.visibility, "hidden", "Captured bodies are hidden");
assert.equal(avatar.dataset.holeMood, "worried", "Avatar is dismayed by a close black hole");
const stepsAtCapture = gravitySteps;
advance(1300);
assert.equal(gravitySteps, stepsAtCapture, "Swallowed planets no longer pull on other bodies");
assert(Number(fireCanvas.dataset.blackHoleRadius) > blackHole.START_RADIUS, "Actual captures grow the black hole");
listeners.get("pointerout")({ relatedTarget: null });
for (let now = 1400; now <= 12500; now += 100) advance(now);
assert(gravitySteps > stepsAtCapture, "Captured planets are replenished after their cooldown");
pointerMedia.matches = true;
advance(12600); advance(12900); advance(13200); advance(13500); advance(13800);
assert.equal(holeCanvas.style.opacity, "1", "Coarse-pointer devices keep the black hole fully visible");
assert.equal(scene.dataset.blackHoleActive, "false", "Mobile never hides a native cursor");
const mobileWanderStart = cursorPosition();
listeners.get("pointerout")({ relatedTarget: null });
assert.equal(holeCanvas.style.opacity, "1", "Touch pointer-out events don't hide the mobile black hole");
for (let now = 13900; now <= 22000; now += 100) {
  advance(now);
  assert.equal(holeCanvas.style.opacity, "1", "Mobile wandering never fades out or enters a quiet period");
}
assert.notDeepEqual(cursorPosition(), mobileWanderStart, "Mobile keeps wandering across multiple targets");
pointerMedia.matches = false;
const pilot = simulatedUfos[0];
Object.assign(pilot, { age: 0, delay: 0, weaponCooldown: 0 });
Object.assign(pilot.body, { x: 300, y: globals.scrollY + 200, vx: 0, vy: 0 });
const hitsBefore = Number(fireCanvas.dataset.antimatterHits), damageBefore = damageRects;
listeners.get("pointermove")({ pointerType: "mouse", clientX: 100, clientY: 200 });
for (let now = 22100; now <= 27400; now += 100) advance(now);
assert(Number(fireCanvas.dataset.antimatterHits) > hitsBefore, "Shared simulation launches and lands UFO missiles");
assert(damageRects > damageBefore, "Real missile impacts render damage on the black-hole canvas");

// Keep every pilot armed to isolate the fleet-wide limit from individual cooldowns.
const launchesBefore = missileLaunches.length;
document.documentElement.clientWidth = 1440;
listeners.get("resize")();
const fleet = simulatedUfos.slice(-2);
for (let now = 27500; now <= 39400; now += 100) {
  listeners.get("pointermove")({ pointerType: "mouse", clientX: 100, clientY: 200 });
  for (const ufo of fleet) {
    Object.assign(ufo, { age: 0, delay: 0, weaponCooldown: 0 });
    Object.assign(ufo.body, { x: 300, y: globals.scrollY + 200, vx: 0, vy: 0 });
  }
  advance(now);
}
assert.equal(fireCanvas.dataset.ufoCount, "2", "Desktop tests multiple simultaneously armed pilots");
const fleetLaunches = missileLaunches.slice(launchesBefore - 1);
assert(fleetLaunches.length >= 3, "The shared cooldown expires and allows later shots");
for (let i = 1; i < fleetLaunches.length; i++)
  assert(fleetLaunches[i] - fleetLaunches[i - 1] >= 4000, "All pilots share a four-second launch gap, including across resets");

// Idle wandering uses the same position for rendering and gravity, without a new loop.
fleet.forEach((ufo) => { ufo.delay = 100; });
listeners.get("pointermove")({ pointerType: "mouse", clientX: 600, clientY: 400 });
for (let now = 39500; now <= 43300; now += 100) advance(now);
assert.deepEqual(cursorPosition(), [600, 400], "Cursor stays put during the four-second idle delay");
const readsBeforeDrift = textReads;
let previousCursor = cursorPosition();
for (let now = 43400; now <= 51400; now += 100) {
  advance(now);
  const point = cursorPosition();
  assert(Math.hypot(point[0] - previousCursor[0], point[1] - previousCursor[1]) <= 6.51, "Idle wandering stays smooth and speed-limited");
  assert(point[0] >= 0 && point[0] <= 1440 && point[1] >= 0 && point[1] <= 844, "Drift stays inside the viewport");
  previousCursor = point;
}
assert.notDeepEqual(cursorPosition(), [600, 400], "An idle black hole wanders away from the mouse");
assert.equal(textReads, readsBeforeDrift, "Wandering doesn't add per-frame layout reads");
assert.equal(frames.size, 1, "Wandering reuses the existing animation loop");
listeners.get("pointermove")({ pointerType: "mouse", clientX: 610, clientY: 410 });
advance(51500);
assert.deepEqual(cursorPosition(), [610, 410], "Mouse movement immediately reclaims the black hole");
for (let now = 51600; now <= 54500; now += 100) advance(now);
assert.deepEqual(cursorPosition(), [610, 410], "Moving the cursor restarts the idle delay");
listeners.get("pointerout")({ relatedTarget: null });
for (let now = 54600; now <= 57500; now += 100) advance(now);
assert.equal(holeCanvas.style.opacity, "0", "Leaving the page disables idle wandering");
pointerMedia.matches = true;
document.documentElement.clientWidth = 390;
listeners.get("resize")();
advance(57600);
assert(cursorPosition()[0] >= 0 && cursorPosition()[0] <= 390, "A narrower mobile viewport keeps the wandering hole on screen");
assert.equal(holeCanvas.style.opacity, "1");
document.hidden = true;
listeners.get("visibilitychange")();
assert.equal(frames.size, 0, "Hidden tabs stop black-hole work too");
assert.equal(holeCanvas.style.opacity, "0");
assert.equal(nextWord.style.transform, "", "Hidden tabs restore undistorted text");
document.hidden = false;
listeners.get("visibilitychange")();
advance(57700);
assert.equal(holeCanvas.style.opacity, "1", "Mobile wandering resumes as soon as the page is visible again");
motion.matches = true;
listeners.get("change")();
assert.equal(frames.size, 0, "Reduced motion disables black holes");
assert.equal(holeCanvas.style.opacity, "0", "Continuous mobile wandering still respects reduced motion");
assert.equal(planetStyle.transform, "", "Reduced motion restores unstretched planets");
motion.matches = false;
cleanupSimulation();
assert.equal(lastTransform, "");
assert.equal(planetStyle.visibility, "");
assert.equal(frames.size, 0);
assert.equal(listeners.size, 0);
assert.equal(scene.dataset.blackHoleActive, undefined);
assert.equal(avatar.dataset.holeMood, undefined, "Avatar returns to its original expression on cleanup");
assert(textObserverDisconnected, "Text observer is cleaned up");
assert.equal(nextWord.style.transform, "");
console.log("Off-screen gravity, transform culling, re-entry and cleanup checks passed");

const workerFrames = new Map(), workerMessages = [], paintedTurns = [];
let workerSerial = 0;
const workerScope = { postMessage: (message) => workerMessages.push(message) };
load("src/lib/planet.worker.ts", {
  "./pixel-planets": { spherePixels: () => [], paintPlanet: (_output, _texture, _w, _h, _pixels, turn) => paintedTurns.push(turn) },
}, {
  self: workerScope,
  requestAnimationFrame: (callback) => { workerFrames.set(++workerSerial, callback); return workerSerial; },
  cancelAnimationFrame: (id) => workerFrames.delete(id),
});
assert.equal(workerMessages[0].supported, true);
const sendWorker = data => workerScope.onmessage({ data });
sendWorker({ type: "init", id: 1, canvas: { getContext: () => ({ createImageData: () => ({ data: [] }), putImageData() {} }) },
  texture: [], kind: "ocean", turn: .08, active: false });
assert.equal(paintedTurns.length, 1, "Inactive/reduced-motion planets still get their static artwork");
assert.equal(workerFrames.size, 0);
sendWorker({ type: "active", id: 1, active: true });
const advanceWorker = now => {
  const [id, callback] = workerFrames.entries().next().value;
  workerFrames.delete(id); callback(now);
};
advanceWorker(1000);
sendWorker({ type: "active", id: 1, active: true });
assert.equal(workerFrames.size, 1, "Repeated visibility messages do not duplicate animation loops");
advanceWorker(1016);
assert(paintedTurns.at(-1) > paintedTurns.at(-2), "Worker preserves smooth terrain rotation");
sendWorker({ type: "active", id: 1, active: false });
assert.equal(workerFrames.size, 0, "No worker animation when all planets are hidden");
sendWorker({ type: "active", id: 1, active: true });
sendWorker({ type: "dispose", id: 1 });
assert.equal(workerFrames.size, 0, "Unmounting removes worker rendering work");
console.log("Worker planet rendering, static fallback frames, visibility and disposal checks passed");

let fallbackPaints = 0;
const fallbackCanvas = {
  dataset: {}, closest: () => ({ style: {} }),
  getContext: () => ({ createImageData: () => ({ data: [] }), putImageData: () => fallbackPaints++ }),
};
const { PixelPlanet } = load("src/components/svg/PixelPlanet.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: initial => ({ current: initial === null ? fallbackCanvas : initial }) },
  "@/lib/pixel-planets": { spherePixels: () => [], paintPlanet() {}, planetMaps: { ocean: "/texture.webp" } },
}, {
  ...globals,
  document: { ...document, createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: [] }) }) }) },
  Image: class { set src(_value) { this.onload(); } },
  IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} disconnect() {} },
});
PixelPlanet({ kind: "ocean" });
const cleanupPlanet = effect();
intersection([{ isIntersecting: true }]);
await new Promise(resolve => setImmediate(resolve));
assert.equal(fallbackCanvas.dataset.ready, "true");
assert.equal(fallbackPaints, 1, "Browsers without worker canvas support still paint the planet");
assert.equal(frames.size, 1, "Main-thread fallback still rotates");
intersection([{ isIntersecting: false }]);
assert.equal(frames.size, 0, "Fallback rendering also stops offscreen");
cleanupPlanet();
assert.equal(listeners.size, 0);
console.log("Unsupported-worker planet fallback and cleanup checks passed");
