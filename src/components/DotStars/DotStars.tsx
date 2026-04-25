import type { CSSProperties } from "react";
import styles from "./DotStars.module.css";

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

const COUNT = 220;
const rng = mulberry32(13);
const DOTS = Array.from({ length: COUNT }, (_, i) => ({
  i,
  l: +(rng() * 99 + 0.5).toFixed(2),
  t: +(rng() * 99 + 0.5).toFixed(2),
  size: +(1.2 + rng() * 3.6).toFixed(2),
  sd: +(2.5 + rng() * 4.5).toFixed(2),
  del: +(rng() * 4).toFixed(2),
}));

export function DotStars() {
  return (
    <div className={styles.layer} aria-hidden>
      {DOTS.map((d) => {
        const style = {
          left: `${d.l}%`,
          top: `${d.t}%`,
          width: `${d.size}px`,
          height: `${d.size}px`,
          transform: "translate(-50%,-50%)",
          ["--sd" as string]: `${d.sd}s`,
          ["--del" as string]: `${d.del}s`,
        } as CSSProperties;
        return <div key={d.i} className={styles.dot} style={style} />;
      })}
    </div>
  );
}
