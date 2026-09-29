"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Scene.module.css";

export function Scene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const decorations = ref.current?.querySelectorAll<HTMLElement>("[data-space-decoration]");
    if (!decorations) return;
    // Only scenery is suspended. Off-screen bodies still participate in gravity.
    const visible = new Set<Element>();
    const sync = () => {
      decorations.forEach((node) => {
        node.style.animationPlayState = visible.has(node) && !document.hidden ? "running" : "paused";
        node.style.visibility = visible.has(node) ? "" : "hidden";
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      sync();
    }, { rootMargin: "100px" });
    decorations.forEach((node) => observer.observe(node));
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      decorations.forEach((node) => { node.style.animationPlayState = ""; node.style.visibility = ""; });
    };
  }, []);
  return <div ref={ref} className={styles.scene} data-space-scene>{children}</div>;
}
