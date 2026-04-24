"use client";

import { useScroll } from "framer-motion";
import { createContext, useContext, useRef, type ReactNode } from "react";
import type { MotionValue } from "framer-motion";
import styles from "./ScrollChapter.module.css";

type ChapterCtx = {
  progress: MotionValue<number>;
};

const Ctx = createContext<ChapterCtx | null>(null);

export function useChapterProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChapterProgress must be used inside ScrollChapter");
  return ctx.progress;
}

export function ScrollChapter({
  id,
  eyebrow,
  title,
  body,
  cards,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  body: ReactNode;
  cards: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <Ctx.Provider value={{ progress: scrollYProgress }}>
      <section ref={ref} id={id} className={styles.section}>
        <div className={styles.pin}>
          <div className={styles.inner}>
            <TextSide eyebrow={eyebrow} title={title} body={body} />
            <div className={styles.cards}>{cards}</div>
          </div>
        </div>
      </section>
    </Ctx.Provider>
  );
}

function TextSide({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <div>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{body}</div>
    </div>
  );
}
