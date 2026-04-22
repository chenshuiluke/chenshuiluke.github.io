import type { CSSProperties, ReactNode } from "react";
import styles from "./FloatingObject.module.css";

type Props = {
  children: ReactNode;
  style: CSSProperties;
  dur?: string;
  delay?: string;
  ty?: string;
  r0?: string;
  r1?: string;
};

export function FloatingObject({
  children,
  style,
  dur = "8s",
  delay = "0s",
  ty = "-12px",
  r0 = "0deg",
  r1 = "5deg",
}: Props) {
  const vars = {
    ...style,
    ["--dur" as string]: dur,
    ["--del" as string]: delay,
    ["--ty" as string]: ty,
    ["--r0" as string]: r0,
    ["--r1" as string]: r1,
  } as CSSProperties;

  return (
    <div className={styles.obj} style={vars}>
      {children}
    </div>
  );
}
