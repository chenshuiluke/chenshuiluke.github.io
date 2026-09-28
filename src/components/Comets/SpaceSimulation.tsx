"use client";

import { useEffect, useRef } from "react";
import {
  createCometFlight,
  recordCometTrail,
  drawCometFire,
  type CometFlight,
} from "@/lib/comet-flight";
import { PixelSprite } from "@/components/svg/PixelSprite";
import styles from "./Comets.module.css";
import { PHYSICS_STEP, seedOrbits, stepGravity, type GravityBody } from "@/lib/gravity";

export function SpaceSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const scene = canvas.closest<HTMLElement>("[data-space-scene]");
    if (!scene) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0, previous = 0, accumulated = 0, worldHeight = 0;
    let planets: { node: HTMLElement; body: GravityBody; tx: number; ty: number }[] = [];
    let flights: { path: CometFlight; delay: number; width: number }[] = [];
    const reset = () => {
      planets.forEach(({ node }) => { node.style.translate = ""; });
      scene.dataset.gravityActive = String(!reduced.matches);
      canvas.width = document.documentElement.clientWidth;
      canvas.height = innerHeight;
      worldHeight = scene.offsetHeight;
      const groups = new Map<Element, GravityBody[]>();
      planets = [...scene.querySelectorAll<HTMLElement>("[data-planet]")].map((node) => {
        const rect = node.getBoundingClientRect();
        const radius = rect.width * 0.41;
        const body = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 + scrollY, vx: 0, vy: 0, mass: radius ** 2 / 10 };
        const group = node.closest("[data-gravity-system]") ?? scene;
        const members = groups.get(group) ?? [];
        members.push(body);
        groups.set(group, members);
        return { node, body, tx: 0, ty: 0 };
      });
      groups.forEach(seedOrbits);
      flights = nodes.current.slice(0, canvas.width <= 540 ? 4 : 6).map((node, i) => ({
        path: createCometFlight(canvas.width, canvas.height, Math.random, scrollY),
        delay: i * 0.9,
        width: node?.offsetWidth || 240,
      }));
      accumulated = 0;
      nodes.current.forEach((node) => {
        if (node) node.style.opacity = "0";
      });
    };
    reset();
    const tick = (now: number) => {
      accumulated += previous ? Math.min(now - previous, 100) / 1000 : 0;
      previous = now;
      while (accumulated >= PHYSICS_STEP) {
        const active = flights.filter((flight) => flight.delay <= 0 && flight.path.duration === Infinity);
        stepGravity([...planets.map((p) => p.body), ...active.map((f) => f.path.body)], PHYSICS_STEP);
        flights.forEach((flight) => {
          if (flight.delay > 0) { flight.delay -= PHYSICS_STEP; return; }
          const path = flight.path;
          path.age += PHYSICS_STEP;
          if (path.duration === Infinity) {
            recordCometTrail(path);
            const { x, y } = path.body;
            // Escaped comets leave the simulation; captured comets keep orbiting.
            if (path.age > 2 && (x < -600 || x > canvas.width + 600 || y < -900 || y > worldHeight + 900))
              path.duration = path.age;
          } else if (path.age > path.duration + 1.4) {
            flight.path = createCometFlight(canvas.width, canvas.height, Math.random, scrollY);
            flight.delay = 0.7 + Math.random() * 1.8;
          }
        });
        accumulated -= PHYSICS_STEP;
      }
      // Read anchors together, then write transforms. Scrolling moves the camera, not bodies.
      const anchors = planets.map(({ node, tx, ty }) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x + rect.width / 2 - tx, y: rect.y + rect.height / 2 - ty };
      });
      planets.forEach((planet, i) => {
        planet.tx = planet.body.x - anchors[i].x;
        planet.ty = planet.body.y - scrollY - anchors[i].y;
        planet.node.style.translate = `${planet.tx}px ${planet.ty}px`;
        planet.node.dataset.gravityX = planet.body.x.toFixed(2);
        planet.node.dataset.gravityY = planet.body.y.toFixed(2);
      });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(0, -scrollY);
      let visibleFlights = 0;
      nodes.current.forEach((node, i) => {
        const flight = flights[i];
        if (!node || !flight) return;
        if (flight.delay > 0) {
          node.style.opacity = "0";
          return;
        }
        drawCometFire(context, flight.path, flight.path.age, flight.width / 192);
        const { x, y, vx, vy } = flight.path.body;
        const angle = Math.atan2(vy, vx) * 180 / Math.PI;
        node.style.transform = `translate3d(${x}px, ${y - scrollY}px, 0) rotate(${angle}deg) translate(-86%, -56%)`;
        node.style.opacity = flight.path.age < flight.path.duration ? "0.95" : "0";
        node.style.filter = `sepia(1) saturate(4) hue-rotate(${flight.path.hue - 25}deg)`;
        node.dataset.heading = angle.toFixed(2);
        visibleFlights++;
      });
      context.restore();
      canvas.dataset.frame = now.toFixed(1);
      canvas.dataset.flights = String(visibleFlights);
      canvas.dataset.gravityBodies = String(planets.length + visibleFlights);
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (!reduced.matches && !document.hidden)
        request = requestAnimationFrame(tick);
    };
    const resize = () => {
      // Mobile browser chrome changes height while scrolling: don't restart the universe.
      if (canvas.width !== document.documentElement.clientWidth) reset();
      canvas.height = innerHeight;
    };
    const motionChanged = () => { reset(); sync(); };
    sync();
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", motionChanged);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", motionChanged);
      window.removeEventListener("resize", resize);
      planets.forEach(({ node }) => { node.style.translate = ""; });
      delete scene.dataset.gravityActive;
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
