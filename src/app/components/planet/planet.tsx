import { motion, useAnimate, useTime, useTransform } from "framer-motion";
import styles from "./planet.module.scss";
import { useEffect } from "react";
import classnames from "classnames";

const Planet = ({ left, top }: { left: number; top: number }) => {
  const [scope, animate] = useAnimate();
  const time = useTime();
  const duration = Math.random() * (10000 - 4000) + 4000;
  const colorList = [
    "dusty",
    "purple",
    "yellow",
    "blue",
    "orange",
    "light-blue",
  ];
  const colorIndex = Math.floor(Math.random() * (colorList.length - 1));
  const selectedColor = colorList[colorIndex];

  const rotate = useTransform(
    time,
    [0, duration],
    [0, 360], // ...rotate 360deg
    { clamp: false }
  );

  return (
    <motion.div
      ref={scope}
      className={classnames(styles.planet, "animated")}
      style={{
        rotate: rotate,
        left: `${left}%`,
        top: `${top}%`,
      }}
    >
      <div className={classnames(styles.surface, styles[selectedColor])}>
        <div className={styles.crater1}></div>
        <div className={styles.crater2}></div>
        <div className={styles.crater3}></div>
      </div>
    </motion.div>
  );
};
export default Planet;
