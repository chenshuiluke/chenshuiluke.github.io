"use client";

import { useEffect, useRef, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"canvas">, "width" | "height"> & {
  src: string;
  width: number;
  height: number;
};

// Match the planets' physical pixel density; CSS animates the painted layers.
export function PixelSprite({ src, width, height, ...props }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const image = new Image();
    image.onload = () => {
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.dataset.ready = "true";
    };
    image.onerror = () => {
      canvas.dataset.ready = "error";
    };
    image.src = src;
    return () => {
      image.onload = image.onerror = null;
    };
  }, [src, width, height]);
  return <canvas ref={ref} width={width} height={height} {...props} />;
}
