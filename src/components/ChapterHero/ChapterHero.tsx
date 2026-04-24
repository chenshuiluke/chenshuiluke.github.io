import type { ReactNode } from "react";
import styles from "./ChapterHero.module.css";

export function ChapterHero({ children }: { children: ReactNode }) {
  return <div className={styles.hero}>{children}</div>;
}
