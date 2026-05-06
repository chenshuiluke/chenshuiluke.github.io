import styles from "./DistantPlanet.module.css";

export function DistantPlanet() {
  return (
    <div className={styles.planet} aria-hidden>
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <ellipse
          cx="45" cy="45" rx="42" ry="10"
          fill="none" stroke="#a070d0" strokeWidth="2" opacity=".55"
          transform="rotate(-15 45 45)"
        />
        <circle cx="45" cy="45" r="22" fill="#604070" stroke="#0b1420" strokeWidth="2.5" />
        <path d="M 28,42 C 33,38 42,37 55,40" fill="none" stroke="#7d5290" strokeWidth="2" opacity=".6" />
        <path d="M 27,49 C 33,46 44,45 60,48" fill="none" stroke="#7d5290" strokeWidth="1.5" opacity=".5" />
        <ellipse
          cx="45" cy="45" rx="42" ry="10"
          fill="none" stroke="#c890e8" strokeWidth="1.4" opacity=".4"
          strokeDasharray="6 3" transform="rotate(-15 45 45)"
        />
      </svg>
    </div>
  );
}
