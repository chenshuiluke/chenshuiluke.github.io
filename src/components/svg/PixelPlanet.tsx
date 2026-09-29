"use client";

import { useEffect, useRef } from "react";
import {
  paintPlanet,
  planetMaps,
  spherePixels,
  type PlanetKind,
} from "@/lib/pixel-planets";
import styles from "./SpaceObjects.module.css";

const SIZE = 96;
const MAP_WIDTH = 384;
const MAP_HEIGHT = 192;
const projections = {
  planet: spherePixels(SIZE),
  moon: spherePixels(SIZE, true),
};
const textures = new Map<PlanetKind, Promise<Uint8ClampedArray>>();
let renderer: Promise<Worker | null> | undefined;
let nextPlanetId = 0;
function planetRenderer() {
  if (!renderer) renderer = new Promise<Worker | null>((resolve) => {
    try {
      const worker = new Worker(new URL("../../lib/planet.worker.ts", import.meta.url));
      worker.onmessage = ({ data }) => {
        if (data.type !== "ready") return;
        if (data.supported) resolve(worker);
        else { worker.terminate(); resolve(null); }
      };
      worker.onerror = () => { worker.terminate(); resolve(null); };
    } catch { resolve(null); }
  });
  return renderer;
}

function loadTexture(kind: PlanetKind) {
  let loading = textures.get(kind);
  if (!loading) {
    loading = new Promise<Uint8ClampedArray>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        try {
          const map = document.createElement("canvas");
          map.width = MAP_WIDTH;
          map.height = MAP_HEIGHT;
          const context = map.getContext("2d", { willReadFrequently: true });
          if (!context) { reject(new Error("Planet texture canvas unavailable")); return; }
          context.drawImage(image, 0, 0);
          resolve(context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT).data);
        } catch (error) { reject(error); }
      };
      image.onerror = () => reject(new Error("Planet texture failed to load"));
      image.src = planetMaps[kind];
    }).catch((error) => { textures.delete(kind); throw error; });
    textures.set(kind, loading);
  }
  return loading;
}

export function PixelPlanet({ kind }: { kind: PlanetKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const turn = useRef(kind === "volcanic" ? 0.35 : 0.08);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let context: CanvasRenderingContext2D | null = null;
    const id = ++nextPlanetId;
    let worker: Worker | null = null;
    const rendererReady = typeof Worker !== "undefined" && typeof canvas.transferControlToOffscreen === "function"
      ? planetRenderer() : Promise.resolve(null);
    const body = canvas.closest<HTMLElement>("[data-planet]");
    const pixels = projections[kind === "moon" ? "moon" : "planet"];
    let frame: ImageData;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let texture: Uint8ClampedArray | undefined;
    let request = 0;
    let previous = 0;
    let visible = false;
    let disposed = false;
    let loading = false;
    const draw = () => {
      if (!texture || !context || body?.style.visibility === "hidden") return;
      paintPlanet(
        frame.data,
        texture,
        MAP_WIDTH,
        MAP_HEIGHT,
        pixels,
        turn.current,
      );
      context.putImageData(frame, 0, 0);
    };
    const tick = (now: number) => {
      if (previous)
        turn.current +=
          Math.min(now - previous, 50) / (kind === "volcanic" ? 46000 : 60000);
      previous = now;
      draw();
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (worker) {
        worker.postMessage({ type: "active", id, active: !disposed && visible && !reduced.matches && !document.hidden });
        return;
      }
      if (
        !disposed &&
        texture &&
        visible &&
        !reduced.matches &&
        !document.hidden
      )
        request = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !loading) {
        loading = true;
        Promise.all([loadTexture(kind), rendererReady]).then(([data, readyWorker]) => {
          if (disposed) return;
          texture = data;
          if (readyWorker) {
            const offscreen = canvas.transferControlToOffscreen();
            worker = readyWorker;
            worker.postMessage({ type: "init", id, canvas: offscreen, texture: data, kind, turn: turn.current,
              active: visible && !reduced.matches && !document.hidden }, [offscreen]);
          } else {
            context = canvas.getContext("2d");
            if (!context) throw new Error("Planet canvas unavailable");
            frame = context.createImageData(SIZE, SIZE);
            draw();
          }
          canvas.dataset.ready = "true";
          sync();
        }).catch(() => {
          if (!disposed) { canvas.dataset.ready = "error"; loading = false; }
        });
      }
      sync();
    });
    observer.observe(canvas);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      worker?.postMessage({ type: "dispose", id });
      cancelAnimationFrame(request);
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [kind]);

  return (
    <span
      className={kind === "moon" ? styles.moon : styles.planet}
      data-planet={kind}
      aria-hidden="true"
    >
      <span className={styles.globe}>
        <canvas key={kind} ref={canvasRef} width={SIZE} height={SIZE} />
      </span>
      <span className={styles.planetGlimmer}>✦</span>
    </span>
  );
}
