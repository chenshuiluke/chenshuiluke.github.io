import { Planet } from "../Svg/Planet";
import styles from "./DistantPlanet.module.css";

export function DistantPlanet() {
  return (
    <div className={styles.planet} aria-hidden>
      <Planet volcanic />
    </div>
  );
}
