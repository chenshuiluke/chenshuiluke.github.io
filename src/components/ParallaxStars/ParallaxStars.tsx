"use client";

import { useEffect, useRef } from "react";
import { createScenery, mulberry32 } from "@/lib/space-scenery";
import styles from "./ParallaxStars.module.css";

type LayerSpec = {
  count: number;
  speed: number;
  sizeMin: number;
  sizeMax: number;
  opacity: number;
  seed: number;
};

const LAYERS: LayerSpec[] = [
  { count: 80, speed: 0.5, sizeMin: 1, sizeMax: 2, opacity: 0.55, seed: 1 },
  { count: 50, speed: 0.35, sizeMin: 1.5, sizeMax: 3, opacity: 0.75, seed: 2 },
  { count: 25, speed: 0.2, sizeMin: 2, sizeMax: 4, opacity: 0.95, seed: 3 },
];

function makeStars(spec: LayerSpec, totalH: number) {
  const rng = mulberry32(spec.seed);
  return Array.from({ length: spec.count }, (_, i) => {
    const x = rng() * 100;
    const y = rng() * totalH;
    const size = spec.sizeMin + rng() * (spec.sizeMax - spec.sizeMin);
    const dur = 2 + rng() * 3;
    const del = rng() * 4;
    return { i, x, y, size, dur, del };
  });
}

const TOTAL_HEIGHT = 12000;
const layers = LAYERS.map((spec) => ({ spec, stars: makeStars(spec, TOTAL_HEIGHT) }));
// Keep the original seeded dot/cross layouts, but batch their animation in one canvas.
const dotRandom = mulberry32(13);
const dots = Array.from({ length: 140 }, () => ({
  x: dotRandom() * 99 + 0.5,
  y: dotRandom() * 99 + 0.5,
  size: 2 + Math.floor(dotRandom() * 2) * 2,
  duration: 2.5 + dotRandom() * 4.5,
  delay: dotRandom() * 4,
}));
const sparkRandom = mulberry32(7);
const sparks = Array.from({ length: 40 }, () => {
  const x = sparkRandom() * 96 + 2, y = sparkRandom() * 98 + 1;
  const duration = 2.4 + sparkRandom() * 3, delay = sparkRandom() * 4;
  const big = sparkRandom() < 0.45;
  const size = big ? 16 + Math.floor(sparkRandom() * 8) : 12 + Math.floor(sparkRandom() * 6);
  return { x, y, duration, delay, big, size };
});
const decorations = [...dots, ...sparks];

export function ParallaxStars({ rich = false }: { rich?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const color = getComputedStyle(canvas).getPropertyValue("--star").trim() || "#fff";
    const drawScenery = createScenery(context, rich);
    let request = 0;
    let cameraY = scrollY;
    let worldHeight = 0;
    let heroHeight = 0;
    const scene = canvas.closest<HTMLElement>("[data-space-scene]");
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawScenery(now / 1000, canvas.width, canvas.height, worldHeight, cameraY, reduced.matches, heroHeight);
      context.fillStyle = color;
      for (const { spec, stars } of layers) {
        const offset = reduced.matches ? 0 : Math.min(cameraY, TOTAL_HEIGHT) * spec.speed;
        for (const star of stars) {
          const y = star.y + offset - cameraY;
          if (y < -4 || y > canvas.height + 4) continue;
          const elapsed = Math.max(0, now / 1000 - star.del);
          const phase = reduced.matches ? 0.5 : (1 - Math.cos(elapsed / star.dur * Math.PI)) / 2;
          context.globalAlpha = spec.opacity * (0.25 + phase * 0.7);
          const size = star.size * (0.8 + phase * 0.25);
          context.fillRect(star.x / 100 * canvas.width, y, size, size);
        }
      }
      for (const star of decorations) {
        const y = star.y / 100 * worldHeight - cameraY;
        if (y < -24 || y > canvas.height + 24) continue;
        const elapsed = Math.max(0, now / 1000 - star.delay);
        const phase = reduced.matches ? 0.65 : (1 - Math.cos(elapsed / star.duration * Math.PI * 2)) / 2;
        context.globalAlpha = phase;
        const size = star.size * (0.35 + phase * 0.65);
        const x = star.x / 100 * canvas.width;
        if (!("big" in star)) {
          context.fillRect(x - size / 2, y - size / 2, size, size);
        } else {
          const unit = size / (star.big ? 22 : 20);
          const reach = star.big ? 10 : 8;
          context.beginPath();
          context.rect(x - 2 * unit, y - reach * unit, 4 * unit, reach * 2 * unit);
          context.rect(x - reach * unit, y - 2 * unit, reach * 2 * unit, 4 * unit);
          if (star.big) context.rect(x - 4 * unit, y - 4 * unit, 8 * unit, 8 * unit);
          context.fill();
        }
      }
    };
    const tick = (now: number) => {
      draw(now);
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      if (document.hidden) return;
      draw(performance.now());
      if (!reduced.matches) request = requestAnimationFrame(tick);
    };
    const resize = () => {
      // Pixel stars need CSS-pixel resolution, not a device-pixel-sized backing store.
      canvas.width = document.documentElement.clientWidth;
      canvas.height = innerHeight;
      measure();
      draw(performance.now());
    };
    const scroll = () => { cameraY = scrollY; if (reduced.matches) draw(0); };
    const measure = () => {
      worldHeight = scene?.offsetHeight ?? innerHeight;
      heroHeight = rich ? scene?.querySelector<HTMLElement>("[data-hero-sky]")?.offsetHeight ?? 0 : 0;
      if (reduced.matches) draw(0);
    };
    const observer = new ResizeObserver(measure);
    if (scene) observer.observe(scene);
    measure();
    resize();
    sync();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(request);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, [rich]);
  return <canvas ref={ref} className={styles.stars} data-parallax-stars aria-hidden="true" />;
}
