"use client";

import { useEffect, useState } from "react";
import styles from "./ReadingProgress.module.css";

export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.bar} style={{ width: `${pct}%` }} />
    </div>
  );
}
