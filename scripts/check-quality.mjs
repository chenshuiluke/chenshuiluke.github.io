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
const scene = { dataset: {}, offsetHeight: 4000, querySelectorAll: () => [planet] };
const fireCanvas = {
  width: 390, height: 844, dataset: {}, closest: () => scene,
  getContext: () => ({ clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {},
    drawImage: (_image, ...geometry) => { assert(geometry.every(Number.isFinite)); stripDraws++; } }),
};
const holeCanvas = { style: {}, getContext: () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} }) };
let simulationRefs = 0;
const pointerMedia = { matches: false };
let body;
const { SpaceSimulation } = load("src/components/Comets/SpaceSimulation.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: (initial) => ({ current: initial === null ? (++simulationRefs === 1 ? fireCanvas : holeCanvas) : initial }) },
  "@/lib/black-hole": blackHole,
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
});
SpaceSimulation();
const cleanupSimulation = effect();
const advance = (now) => {
  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback(now);
};
advance(1000);
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
listeners.get("pointerout")({ relatedTarget: null });
advance(1100);
assert.equal(holeCanvas.style.opacity, "0", "Leaving the page restores the cursor");
listeners.get("pointermove")({ pointerType: "touch", clientX: 320, clientY: 400 });
advance(1120);
assert.equal(holeCanvas.style.opacity, "0", "Touch doesn't create a mouse cursor");
planetTexture.dataset.ready = "true";
listeners.get("pointermove")({ pointerType: "mouse", clientX: body.x + 150, clientY: body.y - globals.scrollY });
advance(1140);
assert.equal(snapshots, 1, "Disruption snapshots the real rotating planet texture once");
assert(stripDraws > 0, "The simulation renders the independent textured strips");
assert.equal(planetStyle.visibility, "hidden", "Strands replace the original planet rather than duplicating it");
listeners.get("pointermove")({ pointerType: "mouse", clientX: body.x, clientY: body.y - globals.scrollY });
advance(1200);
assert.equal(planetStyle.visibility, "hidden", "Captured bodies are hidden");
const stepsAtCapture = gravitySteps;
advance(1300);
assert.equal(gravitySteps, stepsAtCapture, "Swallowed planets no longer pull on other bodies");
assert(Number(fireCanvas.dataset.blackHoleRadius) > blackHole.START_RADIUS, "Actual captures grow the black hole");
listeners.get("pointerout")({ relatedTarget: null });
for (let now = 1400; now <= 12500; now += 100) advance(now);
assert(gravitySteps > stepsAtCapture, "Captured planets are replenished after their cooldown");
pointerMedia.matches = true;
advance(12600); advance(12900); advance(13200); advance(13500); advance(13800);
assert(Number(holeCanvas.style.opacity) > 0, "Coarse-pointer devices spawn a black hole automatically");
assert.equal(scene.dataset.blackHoleActive, "false", "Mobile never hides a native cursor");
for (let now = 13900; now <= 22000; now += 100) advance(now);
assert.equal(holeCanvas.style.opacity, "0", "Mobile bursts end instead of permanently covering content");
document.hidden = true;
listeners.get("visibilitychange")();
assert.equal(frames.size, 0, "Hidden tabs stop black-hole work too");
assert.equal(holeCanvas.style.opacity, "0");
document.hidden = false;
listeners.get("visibilitychange")();
motion.matches = true;
listeners.get("change")();
assert.equal(frames.size, 0, "Reduced motion disables black holes");
assert.equal(planetStyle.transform, "", "Reduced motion restores unstretched planets");
motion.matches = false;
cleanupSimulation();
assert.equal(lastTransform, "");
assert.equal(planetStyle.visibility, "");
assert.equal(frames.size, 0);
assert.equal(listeners.size, 0);
assert.equal(scene.dataset.blackHoleActive, undefined);
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
