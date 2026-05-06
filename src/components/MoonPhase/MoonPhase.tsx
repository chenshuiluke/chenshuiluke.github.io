import styles from "./MoonPhase.module.css";

export function MoonPhase() {
  return (
    <div className={styles.moon} aria-hidden>
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <circle cx="23" cy="23" r="18" fill="#e8dcc8" stroke="#0b1420" strokeWidth="2.5" />
        <circle cx="30" cy="19" r="15" fill="#0d1826" />
        <circle cx="15" cy="22" r="1.6" fill="#bbac96" opacity=".6" />
        <circle cx="19" cy="30" r="1.2" fill="#bbac96" opacity=".5" />
        <circle cx="13" cy="28" r="1" fill="#bbac96" opacity=".5" />
      </svg>
    </div>
  );
}
