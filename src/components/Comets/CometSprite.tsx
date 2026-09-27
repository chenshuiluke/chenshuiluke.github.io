"use client";

import { useContext, useEffect, useRef } from "react";
import { SkyPaused } from "@/components/Scene/Scene";
import { paintComet } from "@/lib/comet-tail";

export function CometSprite({ className }: { className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(0);
  const paused = useContext(SkyPaused);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const source = document.createElement("canvas");
    source.width = 192;
    source.height = 64;
    const sourceContext = source.getContext("2d");
    if (!sourceContext) return;
    context.imageSmoothingEnabled = sourceContext.imageSmoothingEnabled = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const frame = context.createImageData(192, 96);
    let pixels: Uint8ClampedArray;
    let ready = false,
      visible = false,
      disposed = false,
      request = 0,
      previous = 0;
    const draw = () => {
      paintComet(
        frame.data,
        pixels,
        elapsed.current,
        Number(canvas.parentElement?.dataset.bend || 0),
      );
      context.putImageData(frame, 0, 0);
      canvas.dataset.frame = elapsed.current.toFixed(3);
    };
    const tick = (now: number) => {
      if (previous) elapsed.current += Math.min(now - previous, 50) / 1000;
      previous = now;
      draw();
      request = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(request);
      previous = 0;
      if (
        ready &&
        visible &&
        !disposed &&
        !paused &&
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
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      sourceContext.drawImage(image, 0, 0, 192, 64);
      pixels = sourceContext.getImageData(0, 0, 192, 64).data;
      ready = true;
      draw();
      canvas.dataset.ready = "true";
      sync();
    };
    image.onerror = () => {
      canvas.dataset.ready = "error";
    };
    image.src = "/comet-pixel.webp";
    return () => {
      disposed = true;
      cancelAnimationFrame(request);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      image.onload = image.onerror = null;
    };
  }, [paused]);

  return <canvas ref={ref} className={className} width={192} height={96} />;
}
