"use client";

import { createContext, useState, type ReactNode } from "react";
import styles from "./Scene.module.css";

export const SkyPaused = createContext(false);

export function Scene({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <SkyPaused.Provider value={paused}>
      <div className={styles.scene} data-sky-paused={paused}>
        {children}
        <button
          className={styles.motionControl}
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>{" "}
          {paused ? "Resume space" : "Pause space"}
        </button>
      </div>
    </SkyPaused.Provider>
  );
}
