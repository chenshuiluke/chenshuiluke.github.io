"use client";
import { motion } from "framer-motion";
import styles from "./wavy_line.module.css";
const WavyLine = () => {
  return (
    <>
      <div className={`${styles.holder} ${styles.clip}`}>
        <div className={`${styles.ellipse}`}></div>
        <div className={`${styles.ellipse} ${styles.ellipse2}`}></div>
      </div>
    </>
  );
};

export default WavyLine;
