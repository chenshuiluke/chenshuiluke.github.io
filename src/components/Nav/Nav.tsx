import Link from "next/link";
import styles from "./Nav.module.css";

export function Nav() {
  const name = "Luke Chen Shui";
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo} aria-label={`${name} — home`}>
        <span className={styles.stack} aria-hidden="true" data-hole-text>
          <span className={`${styles.layer} ${styles.layerCyan}`}>{name}</span>
          <span className={`${styles.layer} ${styles.layerMagenta}`}>{name}</span>
          <span className={`${styles.layer} ${styles.layerTop}`}>{name}</span>
        </span>
        <span className={styles.srOnly}>{name}</span>
      </Link>
      <div className={styles.links}>
        <Link href="/blog"><span data-hole-text>Blog</span></Link>
      </div>
    </nav>
  );
}
