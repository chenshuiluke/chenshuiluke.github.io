import type { CSSProperties } from "react";
import styles from "./GlowStars.module.css";

const STARS = [
  { top: "24%", left: "18%", size: 8, color: "#ffd6a0", glow: "rgba(255,214,160,.45)", dur: "3.4s", delay: "0s" },
  { top: "42%", left: "78%", size: 6, color: "#aaddff", glow: "rgba(170,221,255,.45)", dur: "4.2s", delay: "1s" },
  { top: "72%", left: "32%", size: 9, color: "#ffffff", glow: "rgba(255,255,255,.4)", dur: "5s", delay: "2s" },
  { top: "18%", left: "62%", size: 5, color: "#ff9aa9", glow: "rgba(255,154,169,.4)", dur: "3.8s", delay: ".6s" },
  { top: "58%", left: "6%", size: 7, color: "#c0e0ff", glow: "rgba(192,224,255,.4)", dur: "4.6s", delay: "1.4s" },
];

export function GlowStars() {
  return (
    <>
      {STARS.map((s, i) => {
        const style: CSSProperties = {
          top: s.top,
          left: s.left,
          width: `${s.size}px`,
          height: `${s.size}px`,
          background: s.color,
          boxShadow: `0 0 ${s.size * 2.5}px ${s.size * 0.75}px ${s.glow}`,
        };
        (style as Record<string, string>)["--gd"] = s.dur;
        (style as Record<string, string>)["--gdd"] = s.delay;
        return <div key={i} className={styles.glowStar} style={style} aria-hidden />;
      })}
    </>
  );
}
