import { useAnimate, useInView } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const Star = ({ left, top }: { left: number; top: number }) => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  const isWhite = Math.random() < 0.5;
  useEffect(() => {
    const maxScale = Math.floor(Math.random() * 10) + 1;
    const duration = Math.random() * (2 - 0.2) + 0.2;
    animate(
      scope.current,
      { scaleX: maxScale, scaleY: maxScale, opacity: 1 },
      {
        // delay,
        duration,
        repeat: Infinity,
        // repeatDelay: 0.2,
        repeatType: "reverse",
      }
    );
  });
  return (
    <div
      ref={scope}
      style={{
        left: `${left}%`,
        top: `${top}%`,
      }}
      className={`star ${isWhite ? "white" : "yellow"}`}
    ></div>
  );
};
export default Star;
