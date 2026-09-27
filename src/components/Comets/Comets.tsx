import styles from "./Comets.module.css";
import { PixelSprite } from "@/components/svg/PixelSprite";

export function Comets() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {[styles.c1, styles.c2, styles.c3, styles.c4].map((path) => (
        <span key={path} className={`${styles.comet} ${path}`} data-comet>
          <PixelSprite
            className={styles.sprite}
            src="/comet-pixel.webp"
            width={192}
            height={64}
          />
        </span>
      ))}
    </div>
  );
}
