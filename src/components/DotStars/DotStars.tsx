import type { CSSProperties } from "react";
import styles from "./DotStars.module.css";

const POSITIONS: Array<[number, number]> = [
  [3, 42], [7, 58], [11, 72], [15, 48], [19, 65], [23, 80], [27, 54],
  [31, 74], [35, 45], [4, 88], [8, 32], [12, 62], [16, 78], [20, 44],
  [39, 68], [43, 85], [47, 52], [51, 78], [55, 62], [59, 88], [57, 36],
  [53, 20], [63, 42], [67, 62], [71, 82], [75, 48], [79, 70], [83, 58],
  [87, 78], [91, 65], [95, 44], [65, 24], [69, 90], [73, 34], [77, 56],
  [81, 82], [85, 68], [89, 48], [93, 78], [97, 60], [2, 25], [10, 15],
  [24, 28], [36, 18], [48, 12], [60, 8], [72, 16], [84, 28], [96, 18],
  [5, 94], [18, 92], [32, 96], [44, 90], [58, 94], [70, 92], [82, 96],
  [94, 88], [13, 50], [26, 38], [42, 62], [56, 48], [68, 74], [80, 42],
  [92, 56],
];

// Deterministic pseudo-random (Mulberry32-ish) so SSR == CSR.
function rand(i: number, salt: number) {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

export function DotStars() {
  return (
    <div>
      {POSITIONS.map(([l, t], i) => {
        const size = 1.2 + rand(i, 1) * 3.8;
        const sd = (2.5 + rand(i, 2) * 4.5).toFixed(1) + "s";
        const del = (rand(i, 3) * 4).toFixed(1) + "s";
        const style = {
          left: `${l}%`,
          top: `${t}%`,
          width: `${size}px`,
          height: `${size}px`,
          transform: "translate(-50%,-50%)",
          ["--sd" as string]: sd,
          ["--del" as string]: del,
        } as CSSProperties;
        return <div key={i} className={styles.dot} style={style} />;
      })}
    </div>
  );
}
