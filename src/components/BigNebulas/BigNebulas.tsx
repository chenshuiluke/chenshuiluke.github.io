import type { CSSProperties } from "react";
import styles from "./BigNebulas.module.css";

const COLORS = ["#2a4a8a", "#5a2a7a", "#3a2870", "#2a5090", "#5a2070", "#3040a0"];
const DRIFTS = [styles.drift1, styles.drift2, styles.drift3] as const;

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

const COUNT = 36;
const rng = mulberry32(42);
const NEBULAS = Array.from({ length: COUNT }, (_, i) => {
  const width = 500 + rng() * 400;
  const height = 380 + rng() * 280;
  const top = (i / COUNT) * 100 + rng() * (100 / COUNT);
  const left = -10 + rng() * 80;
  const opacity = 0.2 + rng() * 0.2;
  const color = COLORS[Math.floor(rng() * COLORS.length)];
  const drift = DRIFTS[Math.floor(rng() * DRIFTS.length)];
  const pulseDelay = rng() * 8;
  const pulseDur = 10 + rng() * 6;
  return { width, height, top, left, opacity, color, drift, pulseDelay, pulseDur };
});

export function BigNebulas() {
  return (
    <>
      {NEBULAS.map((n, i) => {
        const style: CSSProperties = {
          width: n.width,
          height: n.height,
          top: `${n.top}%`,
          left: `${n.left}%`,
          background: `radial-gradient(ellipse, ${n.color} 0%, ${n.color}88 25%, ${n.color}44 45%, transparent 70%)`,
          opacity: n.opacity,
          animationDuration: `${n.pulseDur}s`,
          animationDelay: `${n.pulseDelay}s`,
        };
        return (
          <div
            key={i}
            className={`${styles.bigneb} ${n.drift}`}
            style={style}
            aria-hidden
          />
        );
      })}
    </>
  );
}
