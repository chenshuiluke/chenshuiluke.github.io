"use client";
import { useCallback, useMemo } from "react";
import { motion, useTime, useTransform } from "framer-motion";
import Star from "./star";
import { StarProps, StarData } from "../../types";

const STAR_COUNT = 100; // Reduced from 200 for better performance

const StarContainer: React.FC = () => {
  const time = useTime();
  const rotate = useTransform(time, [0, 30000], [0, 360], { clamp: false });

  // Pre-calculate all star positions and properties once
  const stars = useMemo<StarData[]>(() => {
    return Array.from({ length: STAR_COUNT }).map((_, index) => {
      return {
        id: index,
        left: Math.floor(Math.random() * 101),
        top: Math.floor(Math.random() * 101),
        delay: Math.random() * 2, // Add random delay for more natural effect
        isWhite: Math.random() < 0.5,
      };
    });
  }, []);

  // Memoize the star component renders
  const renderStar = useCallback((starData: StarData) => {
    return (
      <Star
        key={starData.id}
        left={starData.left}
        top={starData.top}
        delay={starData.delay}
        isWhite={starData.isWhite}
      />
    );
  }, []);

  return (
    <motion.div
      style={{ rotate }}
      className="star-container min-w-full relative"
    >
      {stars.map(renderStar)}
    </motion.div>
  );
};

export default StarContainer;
