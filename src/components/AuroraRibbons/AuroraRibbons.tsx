import styles from "./AuroraRibbons.module.css";

export function AuroraRibbons() {
  return (
    <>
      <div data-space-decoration className={`${styles.aurora} ${styles.a1}`} aria-hidden />
      <div data-space-decoration className={`${styles.aurora} ${styles.a2}`} aria-hidden />
    </>
  );
}
