import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import config from "../velite.config.ts";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
// Exercise the real TSX exports without booting Next or adding a test framework.
function load(path, mocks = {}, globals = {}) {
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
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
document.hidden = true;
listeners.get("visibilitychange")();
assert(decorations.every((node) => node.style.animationPlayState === "paused"));
document.hidden = false;
listeners.get("visibilitychange")();
assert.equal(decorations[0].style.animationPlayState, "running");
cleanupScene();
assert(disconnected && listeners.size === 0);
assert(decorations.every((node) => node.style.animationPlayState === ""));

const frames = new Map();
const rectangles = [];
const context = { clearRect() { rectangles.length = 0; }, fillRect(...rect) { rectangles.push(rect); } };
const canvas = { getContext: () => context };
const motion = { ...events, matches: false };
let serial = 0;
const globals = {
  document, window: events, innerHeight: 844, scrollY: 0,
  performance: { now: () => 1000 },
  matchMedia: () => motion,
  getComputedStyle: () => ({ getPropertyValue: () => "#fff" }),
  requestAnimationFrame: (fn) => { frames.set(++serial, fn); return serial; },
  cancelAnimationFrame: (id) => frames.delete(id),
};
const { ParallaxStars } = load("src/components/ParallaxStars/ParallaxStars.tsx", {
  react: { useEffect: (fn) => { effect = fn; }, useRef: () => ({ current: canvas }) },
}, globals);
ParallaxStars();
const cleanupStars = effect();
assert.equal(canvas.width, 390);
assert.equal(canvas.height, 844, "Star backing store stays viewport-sized, not 12000px tall");
assert(rectangles.length > 0 && rectangles.length < 30, "Only visible stars are painted");
assert.equal(frames.size, 1);
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
