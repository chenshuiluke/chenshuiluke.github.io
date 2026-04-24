"use client";

import { motion, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useChapterProgress } from "../ScrollChapter/ScrollChapter";
import styles from "./FloatingColumn.module.css";

/**
 * Bell-curve translateY: rises mid-chapter, settles by the end.
 * Mirrors Cora's floating text-column motion (i=35 in scroll analysis).
 */
export function FloatingColumn({ children }: { children: ReactNode }) {
  const progress = useChapterProgress();

  const y = useTransform(
    progress,
    [0, 0.25, 0.5, 0.75, 1],
    [60, -10, -50, -10, 30],
  );
  const opacity = useTransform(
    progress,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0.4],
  );

  return (
    <motion.div className={styles.col} style={{ y, opacity }}>
      {children}
    </motion.div>
  );
}
