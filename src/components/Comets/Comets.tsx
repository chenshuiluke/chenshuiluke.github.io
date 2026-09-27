import styles from "./Comets.module.css";
import { PixelSprite } from "@/components/svg/PixelSprite";

export function Comets() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {[styles.c1, styles.c2, styles.c3, styles.c4, styles.c5, styles.c6].map(
        (path) => (
          <span key={path} className={`${styles.comet} ${path}`} data-comet>
            <PixelSprite
              className={`${styles.sprite} ${styles.tail}`}
              src="/comet-pixel.webp"
              width={192}
              height={64}
            />
            <PixelSprite
              className={`${styles.sprite} ${styles.ionTail}`}
              src="/comet-pixel.webp"
              width={192}
              height={64}
            />
            <PixelSprite
              className={`${styles.sprite} ${styles.nucleus}`}
              src="/comet-pixel.webp"
              width={192}
              height={64}
            />
          </span>
        ),
      )}
    </div>
  );
}
