import type { CSSProperties } from "react";
import styles from "./Sparkles.module.css";

const BIG_PATH =
  "M0,-9 C1.8,-1.8 1.8,-1.8 9,0 C1.8,1.8 1.8,1.8 0,9 C-1.8,1.8 -1.8,1.8 -9,0 C-1.8,-1.8 -1.8,-1.8 0,-9Z";
const SMALL_PATH =
  "M0,-8 C1.5,-1.5 1.5,-1.5 8,0 C1.5,1.5 1.5,1.5 0,8 C-1.5,1.5 -1.5,1.5 -8,0 C-1.5,-1.5 -1.5,-1.5 0,-8Z";

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

const COUNT = 60;
const rng = mulberry32(7);
const SPARKS = Array.from({ length: COUNT }, () => {
  const left = +(rng() * 96 + 2).toFixed(2);
  const top = +(rng() * 98 + 1).toFixed(2);
  const sd = +(2.4 + rng() * 3).toFixed(2);
  const del = +(rng() * 4).toFixed(2);
  const big = rng() < 0.45;
  const size = big ? 16 + Math.floor(rng() * 8) : 12 + Math.floor(rng() * 6);
  return { left, top, sd, del, big, size };
});

export function Sparkles() {
  return (
    <div className={styles.layer} aria-hidden>
      {SPARKS.map((s, i) => {
        const style = {
          left: `${s.left}%`,
          top: `${s.top}%`,
          ["--sd" as string]: `${s.sd}s`,
          ["--del" as string]: `${s.del}s`,
        } as CSSProperties;
        const vb = s.big ? "-11 -11 22 22" : "-10 -10 20 20";
        return (
          <svg
            key={i}
            className={styles.spark}
            style={style}
            width={s.size}
            height={s.size}
            viewBox={vb}
          >
            <path d={s.big ? BIG_PATH : SMALL_PATH} fill="#eee8dc" />
          </svg>
        );
      })}
    </div>
  );
}
