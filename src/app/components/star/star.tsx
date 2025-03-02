import { motion } from "framer-motion";
import { useRef } from "react";
import { StarProps } from "../../types";

const Star: React.FC<StarProps> = ({ left, top, delay, isWhite }) => {
  const maxScale = useRef(Math.floor(Math.random() * 10) + 10);
  const duration = useRef(Math.random() * (1 - 0.2) + 0.2);

  return (
    <motion.div
      style={{
        left: `${left}%`,
        top: `${top}%`,
      }}
      className={`star ${isWhite ? "white" : "yellow"}`}
      initial={{ opacity: 0 }}
      animate={{
        scaleX: [1, maxScale.current, 1],
        scaleY: [1, maxScale.current, 1],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: duration.current * 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

export default Star;
