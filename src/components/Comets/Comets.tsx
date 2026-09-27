import styles from "./Comets.module.css";
import { CometSprite } from "./CometSprite";

export function Comets() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {[styles.c1, styles.c2, styles.c3, styles.c4, styles.c5, styles.c6].map(
        (path) => (
          <span key={path} className={`${styles.comet} ${path}`} data-comet>
            <CometSprite className={styles.sprite} />
          </span>
        ),
      )}
    </div>
  );
}
