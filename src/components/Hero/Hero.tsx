import styles from "./Hero.module.css";
import { Avatar } from "@/components/Avatar/Avatar";
import { GravityText } from "@/components/GravityText/GravityText";

export function Hero() {
  return (
    <div className={styles.hero}>
      <Avatar />
      <p className={styles.eyebrow}><GravityText>Full Stack Software Engineer</GravityText></p>
      <h1 className={styles.headline}><GravityText>{"Hello, I'm Luke."}</GravityText></h1>
      <div className={styles.ctaRow}>
        <a href="mailto:chenshuiluke@gmail.com" className={`${styles.btn} ${styles.primary}`}>
          <span data-hole-text>Contact me <span aria-hidden="true">✦</span></span>
        </a>
      </div>
    </div>
  );
}
