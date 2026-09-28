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
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const pixels = projections[kind === "moon" ? "moon" : "planet"];
    const frame = context.createImageData(SIZE, SIZE);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let texture: Uint8ClampedArray | undefined;
    let request = 0;
    let previous = 0;
    let visible = false;
    let disposed = false;
    let loading = false;
    const draw = () => {
      if (!texture) return;
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
        loadTexture(kind).then((data) => {
          if (disposed) return;
          texture = data;
          draw();
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
        <canvas ref={canvasRef} width={SIZE} height={SIZE} />
      </span>
      <span className={styles.planetGlimmer}>✦</span>
    </span>
  );
}
