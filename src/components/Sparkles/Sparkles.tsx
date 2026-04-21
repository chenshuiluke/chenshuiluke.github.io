import type { CSSProperties } from "react";
import styles from "./Sparkles.module.css";

type Spark = {
  left: string;
  top: string;
  sd: string;
  del: string;
  size: number;
  big: boolean;
};

const SPARKS: Spark[] = [
  { left: "6%", top: "28%", sd: "2.8s", del: "0s", size: 20, big: true },
  { left: "14%", top: "72%", sd: "3.5s", del: ".7s", size: 16, big: false },
  { left: "28%", top: "58%", sd: "4.1s", del: "1.5s", size: 14, big: false },
  { left: "38%", top: "80%", sd: "3.2s", del: "2.2s", size: 18, big: true },
  { left: "52%", top: "74%", sd: "2.6s", del: "3s", size: 20, big: true },
  { left: "66%", top: "60%", sd: "3.8s", del: "1.9s", size: 16, big: false },
  { left: "78%", top: "32%", sd: "4.4s", del: ".5s", size: 14, big: false },
  { left: "88%", top: "52%", sd: "5s", del: ".9s", size: 22, big: true },
  { left: "93%", top: "78%", sd: "3.1s", del: "2.5s", size: 16, big: false },
  { left: "20%", top: "38%", sd: "4.8s", del: "1.1s", size: 12, big: false },
  { left: "46%", top: "88%", sd: "2.9s", del: "3.3s", size: 18, big: true },
  { left: "60%", top: "20%", sd: "3.7s", del: ".3s", size: 14, big: false },
];

const BIG_PATH =
  "M0,-9 C1.8,-1.8 1.8,-1.8 9,0 C1.8,1.8 1.8,1.8 0,9 C-1.8,1.8 -1.8,1.8 -9,0 C-1.8,-1.8 -1.8,-1.8 0,-9Z";
const SMALL_PATH =
  "M0,-8 C1.5,-1.5 1.5,-1.5 8,0 C1.5,1.5 1.5,1.5 0,8 C-1.5,1.5 -1.5,1.5 -8,0 C-1.5,-1.5 -1.5,-1.5 0,-8Z";

export function Sparkles() {
  return (
    <>
      {SPARKS.map((s, i) => {
        const style = {
          left: s.left,
          top: s.top,
          ["--sd" as string]: s.sd,
          ["--del" as string]: s.del,
        } as CSSProperties;
        const vb = s.big ? "-11 -11 22 22" : "-10 -10 20 20";
        return (
          <svg
            key={i}
            className={styles.spark}
            style={style}
            width={s.size}
            height={s.size}
            viewBox={vb}
          >
            <path d={s.big ? BIG_PATH : SMALL_PATH} fill="#eee8dc" />
          </svg>
        );
      })}
    </>
  );
}
