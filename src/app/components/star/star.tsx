"use client";
import { useAnimate } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
const Star = ({ left, top }: { left: number; top: number }) => {
  const [scope, animate] = useAnimate();
  useEffect(() => {
    const maxScale = Math.floor(Math.random() * 7) + 1;
    const maxMargin = Math.floor(Math.random() * (50 - 20) + 20);
    const duration = Math.random() * (2 - 0.2) + 0.2;
    // animate(
    //   scope.current,
    //   { scaleX: maxScale, scaleY: maxScale, opacity: 1, margin: maxMargin },
    //   {
    //     // delay,
    //     duration,
    //     repeat: Infinity,
    //     // repeatDelay: 0.2,
    //     repeatType: "reverse",
    //   }
    // );
  });
  return (
    <div
      ref={scope}
      style={{
        left: `${left}%`,
        top: `${top}%`,
      }}
      className="star"
    ></div>
  );
};
export default Star;
