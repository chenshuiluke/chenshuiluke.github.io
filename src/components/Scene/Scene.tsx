import type { ReactNode } from "react";
import styles from "./Scene.module.css";

export function Scene({ children }: { children: ReactNode }) {
  return <div className={styles.scene}>{children}</div>;
}
