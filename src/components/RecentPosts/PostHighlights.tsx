"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./RecentPosts.module.css";
import { GravityText } from "@/components/GravityText/GravityText";

type Highlight = { title: string; summary: string; permalink: string };

export function PostHighlights({ posts }: { posts: Highlight[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (posts.length < 2 || paused || hovered || focused) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (!motion.matches && !document.hidden) {
        timer = setInterval(() => setIndex((i) => (i + 1) % posts.length), 8000);
      }
    };
    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [posts.length, paused, hovered, focused]);

  if (!posts.length) return null;
  const post = posts[index % posts.length];

  return (
    <section
      className={styles.section}
      aria-labelledby="recent-posts-heading"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <header className={styles.header}>
        <h2 id="recent-posts-heading"><GravityText>From the blog</GravityText></h2>
        <Link href="/blog"><span data-hole-text>All posts ↗</span></Link>
      </header>
      <div aria-live={paused || focused ? "polite" : "off"} aria-atomic="true">
        <article key={post.permalink} className={styles.card} aria-roledescription="slide" aria-label={`${index % posts.length + 1} of ${posts.length}`}>
          <h3 className={styles.title}><Link href={post.permalink}><GravityText>{post.title}</GravityText></Link></h3>
          <p className={styles.summary}><GravityText>{post.summary}</GravityText></p>
          <Link className={styles.read} href={post.permalink}><span data-hole-text>Read the story <span aria-hidden="true">→</span></span></Link>
        </article>
      </div>
      {posts.length > 1 && (
        <div className={styles.controls}>
          <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>
            <span data-hole-text>{paused ? "Play previews" : "Pause previews"}</span>
          </button>
          <span className={styles.counter} aria-hidden="true">{String(index % posts.length + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}</span>
          <button type="button" aria-label="Previous blog preview" onClick={() => setIndex((i) => (i - 1 + posts.length) % posts.length)}>←</button>
          <button type="button" aria-label="Next blog preview" onClick={() => setIndex((i) => (i + 1) % posts.length)}>→</button>
        </div>
      )}
    </section>
  );
}
