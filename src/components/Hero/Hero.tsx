import styles from "./Hero.module.css";
import { Avatar } from "@/components/Avatar/Avatar";

export function Hero() {
  return (
    <div className={styles.hero}>
      <Avatar />
      <p className={styles.eyebrow}>Full Stack Software Engineer</p>
      <h1 className={styles.headline}>Hello, I&apos;m Luke.</h1>
      <div className={styles.ctaRow}>
        <a href="mailto:chenshuiluke@gmail.com" className={`${styles.btn} ${styles.primary}`}>
          Contact me <span aria-hidden="true">✦</span>
        </a>
      </div>
    </div>
  );
}
