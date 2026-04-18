import styles from "./Rocket.module.css";

export function Rocket() {
  return (
    <div className={styles.fly}>
      <svg width="52" height="115" viewBox="0 0 52 115" fill="none">
        <g className={styles.flame}>
          <path
            d="M 16,80 C 18,96 22,107 26,112 C 30,107 34,96 36,80"
            fill="#ffd166"
            stroke="#0b1420"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M 19,80 C 21,92 24,102 26,106 C 28,102 31,92 33,80"
            fill="#e07a50"
          />
          <path
            d="M 22,80 C 23,88 25,95 26,99 C 27,95 29,88 30,80"
            fill="white"
            opacity=".75"
          />
        </g>
        <rect
          x="12"
          y="28"
          width="28"
          height="52"
          rx="5"
          fill="#f0e6d5"
          stroke="#0b1420"
          strokeWidth="3.5"
        />
        <path
          d="M 26,4 L 12,30 L 40,30 Z"
          fill="#e07a50"
          stroke="#0b1420"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle
          cx="26"
          cy="46"
          r="9"
          fill="#5b8aad"
          stroke="#0b1420"
          strokeWidth="3"
        />
        <circle cx="24" cy="44" r="3" fill="white" opacity=".55" />
        <rect
          x="12"
          y="58"
          width="28"
          height="6"
          fill="#e8dcc8"
          stroke="#0b1420"
          strokeWidth="1.8"
        />
        <path
          d="M 12,64 L 2,82 L 12,78 Z"
          fill="#e07a50"
          stroke="#0b1420"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M 40,64 L 50,82 L 40,78 Z"
          fill="#e07a50"
          stroke="#0b1420"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
