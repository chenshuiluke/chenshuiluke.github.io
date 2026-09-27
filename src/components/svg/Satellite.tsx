import { PixelSprite } from "./PixelSprite";
import styles from "./SpaceObjects.module.css";

export function Satellite() {
  return (
    <div className={styles.satellite} aria-hidden="true">
      {/* One painted sprite, clipped at its mechanical joints into moving layers. */}
      {["wingLeft", "wingRight", "satelliteBody", "dish", "sensorRotor"].map(
        (part) => (
          <PixelSprite
            key={part}
            src="/satellite-pixel-v3.webp"
            width={128}
            height={128}
            draggable={false}
            className={`${styles.satelliteLayer} ${styles[part]}`}
            data-satellite-part={part}
          />
        ),
      )}
    </div>
  );
}
