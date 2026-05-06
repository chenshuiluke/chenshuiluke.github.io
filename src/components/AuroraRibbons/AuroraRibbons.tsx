import styles from "./AuroraRibbons.module.css";

export function AuroraRibbons() {
  return (
    <>
      <div className={`${styles.aurora} ${styles.a1}`} aria-hidden />
      <div className={`${styles.aurora} ${styles.a2}`} aria-hidden />
    </>
  );
}
