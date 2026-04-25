import Link from "next/link";
import { posts } from "@/content";
import styles from "./RecentPosts.module.css";

export function RecentPosts() {
  const latest = [...posts]
    .filter((p) => !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 3);

  if (latest.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-labelledby="recent-posts-heading"
      data-count={latest.length}
    >
      <p id="recent-posts-heading" className={styles.eyebrow}>
        Latest writing
      </p>
      <ul className={styles.row}>
        {latest.map((post, i) => (
          <li key={post.slug} className={styles.item} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
            <Link href={post.permalink} className={styles.card}>
              <time className={styles.meta} dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <h3 className={styles.title}>{post.title}</h3>
              <p className={styles.summary}>{post.summary}</p>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
