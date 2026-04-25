import { posts } from "@/content";
import { PostCard } from "@/components/blog/PostCard";
import styles from "./blog.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Luke Chen Shui",
  description: "Field notes on hardware, tools, and shipping software.",
};

export default function BlogIndex() {
  const sorted = [...posts]
    .filter((p) => !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const allTags = Array.from(new Set(sorted.flatMap((p) => p.tags))).sort();

  return (
    <main className={styles.page}>
      <header className={styles.indexHeader}>
        <div className={styles.kicker}>Field Notes</div>
        <h1 className={styles.title}>
          Perfume notes and <em>patch notes.</em>
        </h1>
        <p className={styles.deck}>
          Fragrance, code, games, anime, and photography — plus the small
          rituals that tie it all together.
        </p>
        {allTags.length > 0 && (
          <ul className={styles.tagBar}>
            {allTags.map((t) => (
              <li key={t}>
                <a
                  href={`/blog/tags/${encodeURIComponent(t)}`}
                  className={styles.tagLink}
                >
                  {t}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className={styles.indexHead}>
        <h2 className={styles.indexHeadTitle}>All essays</h2>
        <span className={styles.indexHeadCount}>
          {sorted.length} post{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className={styles.grid}>
        {sorted.map((post, i) => (
          <li key={post.slug}>
            <PostCard post={post} index={i} />
          </li>
        ))}
      </ul>
    </main>
  );
}
