"use client";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.title}>Until next orbit ✦</h2>
      <p className={styles.sub}>Built with Next.js. Hosted on GitHub Pages.</p>
      <div className={styles.links}>
        <a href="https://github.com/chenshuiluke" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="mailto:chenshuiluke@gmail.com">Email</a>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          Top
        </a>
      </div>
    </footer>
  );
}
