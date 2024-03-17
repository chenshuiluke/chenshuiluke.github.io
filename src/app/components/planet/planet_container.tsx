"use client";
import styles from "./planet.module.scss";
import { useTime, useTransform, motion } from "framer-motion";
import Planet from "./planet";
import classnames from "classnames";

const PlanetContainer = () => {
  const time = useTime();
  const rotate = useTransform(
    time,
    [0, 300000],
    [0, 360], // ...rotate 360deg
    { clamp: false }
  );
  return (
    <motion.div
      style={{ rotate, transform: "translateY(calc(50vh))" }}
      className={classnames(
        styles["planet-container"],
        "min-w-full",
        "relative"
      )}
    >
      {Array.from(Array(10).keys()).map((index) => {
        const left = Math.floor(Math.random() * (100 + 1));
        const top = Math.floor(Math.random() * (100 + 1));
        return <Planet key={index} left={left} top={top} />;
      })}
    </motion.div>
  );
};

export default PlanetContainer;
