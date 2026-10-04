import { PixelSprite } from "../Svg/PixelSprite";
import styles from "./Rocket.module.css";

export function Rocket() {
  return (
    <div className={styles.fly} aria-hidden="true" data-spacecraft="rocket">
      <div className={styles.rocket} data-rocket-part="bank">
        {["hull", "flame"].map((part) => (
          <PixelSprite
            key={part}
            src="/rocket-pixel-v3.webp"
            width={96}
            height={144}
            draggable={false}
            className={styles[part]}
            data-rocket-part={part}
          />
        ))}
      </div>
    </div>
  );
}
