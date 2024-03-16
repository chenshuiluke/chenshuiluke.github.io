"use client";
import { useAnimate } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

const Cloud = () => {
  const [scope, animate] = useAnimate();
  useEffect(() => {
    let delay = Math.floor(Math.random() * 3) + 1;
    animate(
      scope.current,
      { translateY: 10 },
      {
        // delay,
        duration: 2,
        repeat: Infinity,

        // repeatDelay: 0.2,
        repeatType: "reverse",
      }
    );
  });
  return (
    <Image
      className="animated"
      ref={scope}
      src="/images/cloud.png"
      width={100}
      height={100}
      alt="Image of cloud"
    />
  );
};
export default Cloud;
