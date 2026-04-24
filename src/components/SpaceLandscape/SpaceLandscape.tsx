"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import styles from "./SpaceLandscape.module.css";

export function SpaceLandscape() {
  const { scrollY } = useScroll();
  // Slow parallax drift — Cora uses ~0.1× scroll speed.
  const y = useTransform(scrollY, [0, 8000], [0, 800]);

  return (
    <div className={styles.wrap} aria-hidden>
      <motion.div className={styles.shell} style={{ y }}>
        <div className={`${styles.layer} ${styles.atmosphere}`} />
        <div className={`${styles.layer} ${styles.orbit}`} />
        <div className={`${styles.layer} ${styles.orbitGlow}`} />
        <div className={`${styles.layer} ${styles.cosmic}`} />
        <div className={`${styles.layer} ${styles.nebula}`} />
        <div className={`${styles.layer} ${styles.void}`} />
        <div className={`${styles.layer} ${styles.planetGlow}`} />
        <div className={`${styles.layer} ${styles.planetCurve}`} />
      </motion.div>
    </div>
  );
}
