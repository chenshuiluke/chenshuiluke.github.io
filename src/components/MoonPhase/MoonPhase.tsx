import { CrescentMoon } from "../svg/CrescentMoon";
import styles from "./MoonPhase.module.css";

export function MoonPhase() {
  return (
    <div className={styles.moon} aria-hidden>
      <CrescentMoon />
    </div>
  );
}
