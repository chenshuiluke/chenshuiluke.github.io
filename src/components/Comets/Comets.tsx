"use client";

import { useContext, useEffect, useRef } from "react";
import { SkyPaused } from "@/components/Scene/Scene";
import {
  createCometFlight,
  sampleCometFlight,
  type CometFlight,
} from "@/lib/comet-flight";
import styles from "./Comets.module.css";
import { CometSprite } from "./CometSprite";

export function Comets() {
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const flights = useRef<{ path: CometFlight; age: number; width: number }[]>(
    [],
  );
  const paused = useContext(SkyPaused);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0,
      previous = 0;
    const reset = () => {
      const width = document.documentElement.clientWidth,
        height = innerHeight;
      flights.current = nodes.current.map((node, i) => ({
        path: createCometFlight(width, height),
        age: -i * 0.9,
        width: node?.offsetWidth || 240,
      }));
      nodes.current.forEach((node) => {
        if (node) node.style.opacity = "0";
      });
    };
    if (!flights.current.length) reset();
    const tick = (now: number) => {
      const delta = previous ? Math.min(now - previous, 100) / 1000 : 0;
      previous = now;
      const width = document.documentElement.clientWidth;
      nodes.current.forEach((node, i) => {
        if (!node || (width <= 540 && i >= 4)) return;
        const flight = flights.current[i];
        flight.age += delta;
        if (flight.age > flight.path.duration) {
          flight.path = createCometFlight(width, innerHeight);
          flight.age = -0.7 - Math.random() * 1.8;
        }
        if (flight.age < 0) {
          node.style.opacity = "0";
          return;
        }
        const t = flight.age / flight.path.duration;
        const pose = sampleCometFlight(flight.path, t, flight.width);
        node.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.angle}deg) translate(-86%, -56%)`;
        node.style.opacity = String(Math.min(0.9, t * 12, (1 - t) * 12));
        node.style.filter = `hue-rotate(${flight.path.hue}deg)`;
        node.dataset.bend = pose.bend.toFixed(3);
        node.dataset.heading = pose.angle.toFixed(2);
      });
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (!paused && !reduced.matches && !document.hidden)
        request = requestAnimationFrame(tick);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    window.addEventListener("resize", reset);
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      window.removeEventListener("resize", reset);
    };
  }, [paused]);

  return (
    <div className={styles.layer} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          ref={(node) => {
            nodes.current[i] = node;
          }}
          key={i}
          className={styles.comet}
          data-comet
        >
          <CometSprite className={styles.sprite} />
        </span>
      ))}
    </div>
  );
}
