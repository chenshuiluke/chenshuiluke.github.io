"use client";

import { motion, useTransform } from "framer-motion";
import { useChapterProgress } from "../ScrollChapter/ScrollChapter";
import styles from "./AnimatedCard.module.css";

type Props = {
  name: string;
  role: string;
  quote: string;
  /** Stagger offset 0–1: shifts the card's active range later within the chapter. */
  delay?: number;
};

export function AnimatedCard({ name, role, quote, delay = 0 }: Props) {
  const progress = useChapterProgress();

  // Active band: enter at 0.18 + delay → settle at 0.55 + delay → linger → start exiting near 0.9.
  // Cora-style scale: dips to 0.83 mid-flight, then resolves to 1.
  const start = 0.18 + delay * 0.08;
  const peak = 0.5 + delay * 0.08;
  const settled = 0.62 + delay * 0.08;
  const exit = 0.92;

  const y = useTransform(
    progress,
    [start, peak, settled, exit, 1],
    [120, 18, 0, -20, -80],
  );
  const scale = useTransform(
    progress,
    [start, start + 0.04, peak - 0.06, peak, settled, exit],
    [0.92, 0.83, 0.83, 1.0, 1.0, 0.96],
  );
  const opacity = useTransform(
    progress,
    [start, start + 0.06, settled, exit, 1],
    [0, 1, 1, 1, 0],
  );

  return (
    <motion.div
      className={styles.card}
      style={{ y, scale, opacity }}
    >
      <div className={styles.head}>
        <div className={styles.dot} />
        <div className={styles.meta}>
          <span className={styles.name}>{name}</span>
          <span className={styles.role}>{role}</span>
        </div>
      </div>
      <p className={styles.quote}>{quote}</p>
    </motion.div>
  );
}
