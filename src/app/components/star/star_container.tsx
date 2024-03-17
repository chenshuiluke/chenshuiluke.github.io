"use client";
import { useTime, useTransform, motion } from "framer-motion";
import Star from "./star";

const StarContainer = () => {
  const time = useTime();
  const rotate = useTransform(
    time,
    [0, 30000],
    [0, 360], // ...rotate 360deg
    { clamp: false }
  );
  return (
    <motion.div
      style={{ rotate, transform: "translateY(calc(50vh))" }}
      className="star-container min-w-full relative"
    >
      {Array.from(Array(100).keys()).map((index) => {
        const left = Math.floor(Math.random() * (100 + 1));
        const top = Math.floor(Math.random() * (100 + 1));
        return <Star key={index} left={left} top={top} />;
      })}
    </motion.div>
  );
};

export default StarContainer;
