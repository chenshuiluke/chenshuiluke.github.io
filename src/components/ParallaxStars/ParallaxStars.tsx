"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo } from "react";
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

export function ParallaxStars() {
  // Distribute over ~1100vh page = roughly 11000px on desktop. Use 12000px for safety.
  const totalH = 12000;
  const layers = useMemo(
    () => LAYERS.map((s) => ({ spec: s, stars: makeStars(s, totalH) })),
    [],
  );

  return (
    <div className={styles.wrap} aria-hidden>
      {layers.map(({ spec, stars }, li) => (
        <Layer key={li} spec={spec} stars={stars} totalH={totalH} />
      ))}
    </div>
  );
}

function Layer({
  spec,
  stars,
  totalH,
}: {
  spec: LayerSpec;
  stars: ReturnType<typeof makeStars>;
  totalH: number;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, totalH], [0, totalH * spec.speed]);

  return (
    <motion.div className={styles.layer} style={{ y, height: totalH, opacity: spec.opacity }}>
      {stars.map((st) => (
        <span
          key={st.i}
          className={styles.star}
          style={
            {
              left: `${st.x}%`,
              top: `${st.y}px`,
              width: `${st.size}px`,
              height: `${st.size}px`,
              "--dur": `${st.dur}s`,
              "--del": `${st.del}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </motion.div>
  );
}
