import styles from "./Nav.module.css";

export function Nav() {
  return (
    <nav className={styles.nav}>
      <span className={styles.logo}>Luke Chen Shui</span>
      <div className={styles.links}>
        <a href="#">Work</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>
    </nav>
  );
}
