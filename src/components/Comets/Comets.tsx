"use client";

import { useEffect, useRef } from "react";
import {
  createCometFlight,
  sampleCometFlight,
  drawCometFire,
  type CometFlight,
} from "@/lib/comet-flight";
import { PixelSprite } from "@/components/svg/PixelSprite";
import styles from "./Comets.module.css";

export function Comets() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const flights = useRef<{ path: CometFlight; age: number; width: number }[]>(
    [],
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0,
      previous = 0;
    const reset = () => {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = innerHeight;
      flights.current = nodes.current.map((node, i) => ({
        path: createCometFlight(canvas.width, canvas.height),
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
      context.clearRect(0, 0, canvas.width, canvas.height);
      let visibleFlights = 0;
      nodes.current.forEach((node, i) => {
        if (!node || (canvas.width <= 540 && i >= 4)) return;
        const flight = flights.current[i];
        flight.age += delta;
        if (flight.age > flight.path.duration + 1.3) {
          flight.path = createCometFlight(canvas.width, canvas.height);
          flight.age = -0.7 - Math.random() * 1.8;
        }
        if (flight.age < 0) {
          node.style.opacity = "0";
          return;
        }
        // The world-space canvas keeps old embers alive after the head turns or exits.
        drawCometFire(context, flight.path, flight.age, flight.width / 192);
        const pose = sampleCometFlight(
          flight.path,
          Math.min(1, flight.age / flight.path.duration),
        );
        node.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.angle}deg) translate(-86%, -56%)`;
        node.style.opacity = flight.age < flight.path.duration ? "0.95" : "0";
        node.style.filter = `sepia(1) saturate(4) hue-rotate(${flight.path.hue - 25}deg)`;
        node.dataset.heading = pose.angle.toFixed(2);
        visibleFlights++;
      });
      canvas.dataset.frame = now.toFixed(1);
      canvas.dataset.flights = String(visibleFlights);
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (!reduced.matches && !document.hidden)
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
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.fire} data-comet-fire />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          ref={(node) => {
            nodes.current[i] = node;
          }}
          className={styles.comet}
          data-comet
        >
          <PixelSprite
            className={styles.head}
            src="/comet-pixel.webp"
            width={192}
            height={64}
          />
        </span>
      ))}
    </div>
  );
}
