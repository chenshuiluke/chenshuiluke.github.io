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
import { createTidalStream, crossedHorizon, drawTidalStream, growBlackHole, HORIZON, HOLE_HEIGHT, HOLE_WIDTH, paintBlackHole, pullIntoHole, respawnPlanet, START_RADIUS, stepTidalStream, tidalShape, type BlackHole, type TidalStream } from "@/lib/black-hole";

export function SpaceSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holeRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const holeCanvas = holeRef.current;
    const holeContext = holeCanvas?.getContext("2d");
    if (!canvas || !context || !holeCanvas || !holeContext) return;
    const scene = canvas.closest<HTMLElement>("[data-space-scene]");
    if (!scene) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(hover: none), (pointer: coarse)");
    const hole: BlackHole = { x: 0, y: 0, strength: 0, radius: START_RADIUS };
    let displayedRadius = START_RADIUS;
    const holeFrames = Array.from({ length: 16 }, (_, i) => {
      const frame = holeContext.createImageData(HOLE_WIDTH, HOLE_HEIGHT);
      paintBlackHole(frame.data, i / 16);
      return frame;
    });
    let mouseInside = false, pointerX = 0, pointerY = 0;
    let elapsed = 0, nextHole = 2, holeBorn = 0, holeUntil = 0, lastHoleFrame = -1;
    let captures = 0, lastDebris = 0;
    const debris: (GravityBody & { life: number; color: string; size: number })[] = [];
    let streams: { effect: TidalStream; image: HTMLCanvasElement }[] = [];
    const disrupt = (body: GravityBody, source: HTMLCanvasElement | null, diameter: number, hue?: number) => {
      if (source?.dataset.ready !== "true" || streams.length >= 18) return false;
      const image = document.createElement("canvas");
      image.width = image.height = hue === undefined ? 96 : 32;
      const paint = image.getContext("2d");
      if (!paint) return false;
      paint.imageSmoothingEnabled = false;
      paint.translate(image.width / 2, image.height / 2);
      // Undo the strip axis in the snapshot so terrain doesn't jump when it tears.
      paint.rotate(-Math.atan2(hole.y - body.y, hole.x - body.x));
      if (hue === undefined) paint.drawImage(source, -48, -48, 96, 96);
      else {
        paint.filter = `sepia(1) saturate(4) hue-rotate(${hue - 25}deg)`;
        // Only the rocky nucleus, never the sprite's baked-in tail.
        paint.drawImage(source, 155, 23, 31, 30, -16, -16, 32, 32);
      }
      streams.push({ effect: createTidalStream(body, hole, diameter), image });
      return true;
    };
    const shed = (body: GravityBody, count: number, color: string) => {
      for (let i = 0; i < count && debris.length < 160; i++) {
        debris.push({ x: body.x + (Math.random() - .5) * 22, y: body.y + (Math.random() - .5) * 22,
          vx: body.vx * .35 + (Math.random() - .5) * 100, vy: body.vy * .35 + (Math.random() - .5) * 100,
          mass: 0, life: .5 + Math.random() * .8, color: i % 3 ? color : "#ffe8ae", size: 2 + Math.random() * 3 });
      }
    };
    let request = 0, previous = 0, accumulated = 0, worldHeight = 0, lastDiagnostic = 0;
    let anchorsDirty = true;
    // Reading scrollY after transform writes forces a synchronous style flush.
    // Capture it in the scroll handler, never between animation-frame writes.
    let cameraY = scrollY;
    let planets: { node: HTMLElement; source: HTMLCanvasElement | null; diameter: number; disrupted: boolean; disruptedAt: number; body: GravityBody; tx: number; ty: number; anchorX: number; anchorY: number; radius: number; visible: boolean; delay: number; color: string }[] = [];
    let flights: { path: CometFlight; delay: number; width: number; source: HTMLCanvasElement | null; disrupted: boolean; disruptedAt: number }[] = [];
    const spawn = () => createCometFlight(canvas.width, canvas.height, Math.random, cameraY, planets.map((p) => p.body));
    const reset = () => {
      planets.forEach(({ node }) => { node.style.translate = ""; node.style.visibility = ""; node.style.transform = ""; node.style.opacity = ""; });
      debris.length = 0;
      streams = [];
      scene.dataset.gravityActive = String(!reduced.matches);
      canvas.width = document.documentElement.clientWidth;
      canvas.height = innerHeight;
      worldHeight = scene.offsetHeight;
      const groups = new Map<Element, GravityBody[]>();
      planets = [...scene.querySelectorAll<HTMLElement>("[data-planet]")].map((node) => {
        const rect = node.getBoundingClientRect();
        const radius = rect.width * 0.41;
        const body = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 + cameraY, vx: 0, vy: 0, mass: radius ** 2 / 10 };
        const group = node.closest("[data-gravity-system]") ?? scene;
        const members = groups.get(group) ?? [];
        members.push(body);
        groups.set(group, members);
        const color = ({ gold: "#ffca62", jade: "#a8ef87", volcanic: "#ff784b", moon: "#c6b4ef" } as Record<string, string>)[node.dataset.planet ?? ""] ?? "#69d7de";
        return { node, source: node.querySelector<HTMLCanvasElement>("canvas"), diameter: radius * 2, disrupted: false, disruptedAt: 0,
          body, tx: 0, ty: 0, anchorX: body.x, anchorY: body.y, radius: Math.max(rect.width, rect.height) / 2 + 32, visible: true, delay: 0, color };
      });
      groups.forEach(seedOrbits);
      flights = nodes.current.slice(0, canvas.width <= 540 ? 4 : 6).map((node, i) => ({
        path: spawn(),
        delay: i * 0.9,
        width: node?.offsetWidth || 240,
        source: node?.querySelector<HTMLCanvasElement>("canvas") ?? null,
        disrupted: false, disruptedAt: 0,
      }));
      accumulated = 0;
      anchorsDirty = true;
      nodes.current.forEach((node) => {
        if (node) node.style.opacity = "0";
      });
    };
    reset();
    const tick = (now: number) => {
      const dt = previous ? Math.min(now - previous, 100) / 1000 : 0;
      accumulated += dt;
      elapsed += dt;
      previous = now;
      if (coarse.matches && elapsed >= nextHole) {
        pointerX = canvas.width * (.18 + Math.random() * .64);
        pointerY = canvas.height * (.2 + Math.random() * .6);
        holeBorn = elapsed;
        holeUntil = elapsed + 7;
        nextHole = holeUntil + 5 + Math.random() * 3;
      }
      hole.x = pointerX;
      hole.y = pointerY + cameraY;
      hole.strength = coarse.matches ? Math.max(0, Math.min(1, (elapsed - holeBorn) * 2, (holeUntil - elapsed) * 2)) : Number(mouseInside);
      while (accumulated >= PHYSICS_STEP) {
        streams.forEach(({ effect }) => stepTidalStream(effect, hole, PHYSICS_STEP));
        planets.forEach((planet) => {
          // If the cursor moves away mid-disruption, dissipate the remnant rather
          // than snapping the torn planet back into a sphere.
          if (planet.disrupted && planet.delay <= 0 && elapsed - planet.disruptedAt > 4) planet.delay = 3;
          if (planet.delay <= 0) return;
          planet.delay -= PHYSICS_STEP;
          if (planet.delay <= 0) {
            respawnPlanet(planet.body, canvas.width, canvas.height, cameraY);
            planet.disrupted = false;
          }
        });
        const active = flights.filter((flight) => flight.delay <= 0 && flight.path.duration === Infinity);
        const livePlanets = planets.filter((planet) => planet.delay <= 0);
        const bodies = [...livePlanets.map((p) => p.body), ...active.map((f) => f.path.body)];
        const starts = hole.strength > 0 ? bodies.map((body) => ({ x: body.x, y: body.y })) : [];
        if (hole.strength > 0) bodies.forEach((body) => pullIntoHole(body, hole, PHYSICS_STEP));
        stepGravity(bodies, PHYSICS_STEP);
        bodies.forEach((body, i) => {
          if (!starts[i] || !crossedHorizon(starts[i].x, starts[i].y, body, hole)) return;
          captures++;
          growBlackHole(hole, body.mass);
          const planet = livePlanets[i];
          shed(body, planet ? 18 : 8, planet?.color ?? "#ff9e60");
          if (planet) planet.delay = 6 + Math.random() * 4;
          else active[i - livePlanets.length].path.duration = active[i - livePlanets.length].path.age;
        });
        flights.forEach((flight) => {
          if (flight.delay > 0) { flight.delay -= PHYSICS_STEP; return; }
          const path = flight.path;
          path.age += PHYSICS_STEP;
          if (flight.disrupted && path.duration === Infinity && path.age - flight.disruptedAt > 4) path.duration = path.age;
          if (path.duration === Infinity) {
            recordCometTrail(path);
            const { x, y } = path.body;
            // Escaped comets leave the simulation; captured comets keep orbiting.
            if (path.age > 2 && (x < -600 || x > canvas.width + 600 || y < -900 || y > worldHeight + 900))
              path.duration = path.age;
          } else if (path.age > path.duration + 1.4) {
            flight.path = spawn();
            flight.delay = 0.7 + Math.random() * 1.8;
            flight.disrupted = false;
          }
        });
        accumulated -= PHYSICS_STEP;
      }
      // Layout is stable between scroll/resize events: don't measure 15 elements every frame.
      if (anchorsDirty) {
        planets.forEach((planet) => {
          const rect = planet.node.getBoundingClientRect();
          planet.anchorX = rect.x + rect.width / 2 - planet.tx;
          planet.anchorY = rect.y + rect.height / 2 + cameraY - planet.ty;
        });
        anchorsDirty = false;
      }
      planets.forEach((planet) => {
        const { x, y } = planet.body;
        const r = planet.radius;
        const tide = tidalShape(planet.body, hole);
        if (!planet.disrupted && planet.delay <= 0 && tide.amount > .18) {
          planet.disrupted = disrupt(planet.body, planet.source, planet.diameter);
          planet.disruptedAt = elapsed;
        }
        const visible = !planet.disrupted && planet.delay <= 0 && x > -r && x < canvas.width + r && y > cameraY - r && y < cameraY + canvas.height + r;
        if (visible !== planet.visible) planet.node.style.visibility = visible ? "" : "hidden";
        // Apply the exit position once so texture observers also leave the viewport.
        const move = visible || planet.visible;
        planet.visible = visible;
        if (!move) return;
        planet.tx = (planet.delay > 0 || planet.disrupted ? -1000 : x) - planet.anchorX;
        planet.ty = (planet.delay > 0 || planet.disrupted ? -1000 : y) - planet.anchorY;
        planet.node.style.translate = `${planet.tx}px ${planet.ty}px`;
        const transform = tide.amount > 0 && planet.delay <= 0
          ? `rotate(${tide.angle}deg) scale(${tide.stretch}, ${tide.squeeze}) rotate(${-tide.angle}deg)` : "";
        const opacity = tide.amount > 0 ? String(tide.opacity) : "";
        if (planet.node.style.transform !== transform) planet.node.style.transform = transform;
        if (planet.node.style.opacity !== opacity) planet.node.style.opacity = opacity;
        if (visible && tide.amount > .15 && elapsed - lastDebris > .035) shed(planet.body, 2, planet.color);
      });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(0, -cameraY);
      let visibleFlights = 0;
      nodes.current.forEach((node, i) => {
        const flight = flights[i];
        if (!node || !flight) return;
        if (flight.delay > 0) {
          node.style.opacity = "0";
          return;
        }
        drawCometFire(context, flight.path, flight.path.age, flight.width / 192, { top: cameraY, bottom: cameraY + canvas.height, left: 0, right: canvas.width });
        const { x, y, vx, vy } = flight.path.body;
        const tide = tidalShape(flight.path.body, hole);
        if (!flight.disrupted && flight.path.duration === Infinity && tide.amount > .28) {
          flight.disrupted = disrupt(flight.path.body, flight.source, flight.width * .17, flight.path.hue);
          flight.disruptedAt = flight.path.age;
        }
        const headVisible = !flight.disrupted && flight.path.age < flight.path.duration && x > -flight.width && x < canvas.width + flight.width && y > cameraY - flight.width && y < cameraY + canvas.height + flight.width;
        const opacity = headVisible ? "0.95" : "0";
        if (node.style.opacity !== opacity) node.style.opacity = opacity;
        if (!headVisible) return;
        const angle = tide.amount > .1 ? tide.angle : Math.atan2(vy, vx) * 180 / Math.PI;
        node.style.transform = `translate3d(${x}px, ${y - cameraY}px, 0) rotate(${angle}deg) scale(${tide.stretch}, ${tide.squeeze}) translate(-86%, -56%)`;
        if (tide.amount > .15 && elapsed - lastDebris > .035) shed(flight.path.body, 1, "#ffc477");
        if (node.dataset.hue !== String(flight.path.hue)) {
          node.style.filter = `sepia(1) saturate(4) hue-rotate(${flight.path.hue - 25}deg)`;
          node.dataset.hue = String(flight.path.hue);
        }
        visibleFlights++;
      });
      streams = streams.filter(({ effect }) => effect.age < 4 && effect.fragments.some((fragment) => !fragment.swallowed));
      streams.forEach(({ effect, image }) => drawTidalStream(context, image, effect, hole));
      if (elapsed - lastDebris > .035) lastDebris = elapsed;
      let alive = 0;
      for (const particle of debris) {
        particle.life -= dt;
        const x = particle.x, y = particle.y;
        pullIntoHole(particle, hole, dt);
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.life <= 0 || crossedHorizon(x, y, particle, hole)) continue;
        debris[alive++] = particle;
        context.globalAlpha = Math.min(1, particle.life * 2);
        context.fillStyle = particle.color;
        const size = Math.round(particle.size);
        context.fillRect(Math.round(particle.x), Math.round(particle.y), size, size);
      }
      debris.length = alive;
      context.restore();
      const cursorActive = String(hole.strength > 0 && !coarse.matches);
      if (scene.dataset.blackHoleActive !== cursorActive) scene.dataset.blackHoleActive = cursorActive;
      holeCanvas.style.opacity = String(hole.strength);
      if (hole.strength > 0) {
        displayedRadius += ((hole.radius ?? START_RADIUS) - displayedRadius) * (1 - Math.exp(-dt * 7));
        holeCanvas.style.transform = `translate3d(${pointerX - HOLE_WIDTH}px, ${pointerY - HOLE_HEIGHT}px, 0) scale(${displayedRadius / HORIZON * (.6 + hole.strength * .4)})`;
        const frame = Math.floor(elapsed * 12) % holeFrames.length;
        if (frame !== lastHoleFrame) { holeContext.putImageData(holeFrames[frame], 0, 0); lastHoleFrame = frame; }
      }
      if (now - lastDiagnostic >= 250) {
        canvas.dataset.frame = now.toFixed(1);
        canvas.dataset.gravityBodies = String(planets.length + visibleFlights);
        canvas.dataset.blackHoleCaptures = String(captures);
        canvas.dataset.blackHoleRadius = String(hole.radius);
        lastDiagnostic = now;
      }
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (document.hidden || reduced.matches) {
        mouseInside = false;
        hole.strength = 0;
        holeCanvas.style.opacity = "0";
        delete scene.dataset.blackHoleActive;
      }
      if (!reduced.matches && !document.hidden)
        request = requestAnimationFrame(tick);
    };
    const resize = () => {
      // Mobile browser chrome changes height while scrolling: don't restart the universe.
      if (canvas.width !== document.documentElement.clientWidth) reset();
      canvas.height = innerHeight;
      anchorsDirty = true;
    };
    const moved = () => { cameraY = scrollY; anchorsDirty = true; };
    const pointerMoved = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches) return;
      pointerX = event.clientX; pointerY = event.clientY; mouseInside = true;
    };
    const pointerLeft = () => { mouseInside = false; holeCanvas.style.opacity = "0"; delete scene.dataset.blackHoleActive; };
    const pointerOut = (event: PointerEvent) => { if (!event.relatedTarget) pointerLeft(); };
    const layoutObserver = new ResizeObserver(() => { anchorsDirty = true; worldHeight = scene.offsetHeight; });
    layoutObserver.observe(scene);
    const motionChanged = () => { reset(); sync(); };
    sync();
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", motionChanged);
    window.addEventListener("pointermove", pointerMoved, { passive: true });
    window.addEventListener("pointerout", pointerOut);
    window.addEventListener("blur", pointerLeft);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", moved, { passive: true });
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", motionChanged);
      window.removeEventListener("pointermove", pointerMoved);
      window.removeEventListener("pointerout", pointerOut);
      window.removeEventListener("blur", pointerLeft);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", moved);
      layoutObserver.disconnect();
      planets.forEach(({ node }) => { node.style.translate = ""; node.style.visibility = ""; node.style.transform = ""; node.style.opacity = ""; });
      delete scene.dataset.gravityActive;
      delete scene.dataset.blackHoleActive;
    };
  }, []);

  return (
    <>
    <div className={styles.layer} aria-hidden="true">
      <link rel="preload" as="image" href="/space/comet-pixel.webp" />
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
            src="/space/comet-pixel.webp"
            width={192}
            height={64}
          />
        </span>
      ))}
    </div>
    <canvas ref={holeRef} width={HOLE_WIDTH} height={HOLE_HEIGHT} className={styles.blackHole} data-black-hole aria-hidden="true" />
    </>
  );
}
