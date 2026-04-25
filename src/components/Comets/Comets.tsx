"use client";

import { useEffect, useRef } from "react";
import styles from "./Comets.module.css";

type CometDef = {
  cls: string;
  headRight: boolean;
  palette: string[];
  headColor: string;
  haloAlphas: [number, number, number?];
};

const COMETS: CometDef[] = [
  {
    cls: "c1",
    headRight: true,
    palette: ["#ffffff", "#fffde0", "#ffd166", "#fff8a0"],
    headColor: "white",
    haloAlphas: [0.95, 0.2, 0.06],
  },
  {
    cls: "c2",
    headRight: true,
    palette: ["#aaddff", "#c8eeff", "#ffffff", "#88ccff"],
    headColor: "#aaddff",
    haloAlphas: [0.95, 0.22, 0.07],
  },
  {
    cls: "c3",
    headRight: false,
    palette: ["#ffe080", "#ffd040", "#ffffff", "#ffec90"],
    headColor: "#ffe080",
    haloAlphas: [0.95, 0.2, 0.06],
  },
  {
    cls: "c4",
    headRight: false,
    palette: ["#ffaacc", "#ff88bb", "#ffffff", "#ffddee"],
    headColor: "#ffaacc",
    haloAlphas: [0.95, 0.2],
  },
];

export function Comets() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cfgs = COMETS.map((c) => ({
      el: root.querySelector(`.${styles[c.cls]}`) as HTMLElement | null,
      hr: c.headRight,
      pal: c.palette,
    })).filter((c) => c.el);

    let fc = 0;
    let raf = 0;
    const spawned: HTMLDivElement[] = [];

    const dropDust = (x: number, y: number, pal: string[]) => {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const p = document.createElement("div");
        const sz = +(1.2 + Math.random() * 4.2).toFixed(1);
        const col = pal[Math.floor(Math.random() * pal.length)];
        const dur = +(1.4 + Math.random() * 2.2).toFixed(2);
        const del = +(Math.random() * 0.25).toFixed(2);
        const dx = (Math.random() - 0.5) * 28;
        const dy = (Math.random() - 0.5) * 28;
        p.className = styles.trailP;
        p.style.cssText = [
          `left:${x + dx}px`,
          `top:${y + dy}px`,
          `width:${sz}px`,
          `height:${sz}px`,
          `background:${col}`,
          `box-shadow:0 0 ${sz * 2.5}px ${sz}px ${col}55`,
          `animation:trailFade ${dur}s ${del}s ease-out forwards`,
        ].join(";");
        document.body.appendChild(p);
        spawned.push(p);
        window.setTimeout(() => p.remove(), (dur + del + 0.15) * 1000);
      }
    };

    const tick = () => {
      fc++;
      if (fc % 3 === 0) {
        for (const cfg of cfgs) {
          const svg = cfg.el?.querySelector("svg");
          if (!svg) continue;
          const r = svg.getBoundingClientRect();
          const hx = cfg.hr ? r.right - 14 : r.left + 14;
          const hy = r.top + r.height / 2;
          if (
            hx > -80 &&
            hx < window.innerWidth + 80 &&
            hy > -80 &&
            hy < window.innerHeight + 80
          ) {
            dropDust(hx, hy, cfg.pal);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const p of spawned) p.remove();
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.layer} aria-hidden>
      {COMETS.map((c) => {
        const cx = c.headRight ? 42 : 14;
        return (
          <div key={c.cls} className={`${styles.comet} ${styles[c.cls]}`}>
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none">
              <circle cx={cx} cy="20" r="7" fill={c.headColor} opacity={c.haloAlphas[0]} />
              <circle cx={cx} cy="20" r="14" fill={c.headColor} opacity={c.haloAlphas[1]} />
              {c.haloAlphas[2] != null && (
                <circle cx={cx} cy="20" r="22" fill={c.headColor} opacity={c.haloAlphas[2]} />
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
