import { CrescentMoon } from "../Svg/CrescentMoon";
import styles from "./MoonPhase.module.css";

export function MoonPhase() {
  return (
    <div className={styles.moon} aria-hidden>
      <CrescentMoon />
    </div>
  );
}
