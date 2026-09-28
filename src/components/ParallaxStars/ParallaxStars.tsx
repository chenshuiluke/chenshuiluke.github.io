"use client";

import { useEffect, useRef } from "react";
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

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

export function ParallaxStars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const color = getComputedStyle(canvas).getPropertyValue("--star").trim() || "#fff";
    let request = 0;
    const draw = (now: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      for (const { spec, stars } of layers) {
        const offset = reduced.matches ? 0 : Math.min(scrollY, TOTAL_HEIGHT) * spec.speed;
        for (const star of stars) {
          const y = star.y + offset - scrollY;
          if (y < -4 || y > canvas.height + 4) continue;
          const elapsed = Math.max(0, now / 1000 - star.del);
          const phase = reduced.matches ? 0.5 : (1 - Math.cos(elapsed / star.dur * Math.PI)) / 2;
          context.globalAlpha = spec.opacity * (0.25 + phase * 0.7);
          const size = star.size * (0.8 + phase * 0.25);
          context.fillRect(star.x / 100 * canvas.width, y, size, size);
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
      draw(performance.now());
    };
    const scroll = () => { if (reduced.matches) draw(0); };
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
    };
  }, []);
  return <canvas ref={ref} className={styles.stars} data-parallax-stars aria-hidden="true" />;
}
