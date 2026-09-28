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

export function PixelPlanet({ kind }: { kind: PlanetKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const turn = useRef(kind === "volcanic" ? 0.35 : 0.08);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const pixels = spherePixels(SIZE, kind === "moon");
    const frame = context.createImageData(SIZE, SIZE);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let texture: Uint8ClampedArray | undefined;
    let request = 0;
    let previous = 0;
    let visible = false;
    let disposed = false;
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
      canvas.dataset.rotation = turn.current.toFixed(5);
      canvas.dataset.ready = "true";
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
      sync();
    });
    observer.observe(canvas);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const map = document.createElement("canvas");
      map.width = MAP_WIDTH;
      map.height = MAP_HEIGHT;
      const mapContext = map.getContext("2d", { willReadFrequently: true });
      if (!mapContext) return;
      mapContext.imageSmoothingEnabled = false;
      mapContext.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      texture = mapContext.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT).data;
      draw();
      sync();
    };
    image.onerror = () => {
      canvas.dataset.ready = "error";
    };
    image.src = planetMaps[kind];
    return () => {
      disposed = true;
      cancelAnimationFrame(request);
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      image.onload = image.onerror = null;
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
