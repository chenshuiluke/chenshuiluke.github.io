import styles from "./Hero.module.css";

export function Hero() {
  return (
    <div className={styles.hero}>
      <p className={styles.eyebrow}>Full Stack Software Engineer</p>
      <h1 className={styles.headline}>Hello, I&apos;m Luke.</h1>
      <div className={styles.ctaRow}>
        <a href="#" className={`${styles.btn} ${styles.primary}`}>
          See my work ✦
        </a>
        <a href="#" className={`${styles.btn} ${styles.ghost}`}>
          Say hello
        </a>
      </div>
    </div>
  );
}
