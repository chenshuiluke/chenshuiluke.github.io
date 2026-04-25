import Link from "next/link";
import type { Post } from "@/content";
import { PostCard } from "./PostCard";
import styles from "./ContinueReading.module.css";

export function ContinueReading({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={styles.more}>
      <div className={styles.head}>
        <div className={styles.h}>Continue reading</div>
        <Link className={styles.a} href="/blog">
          All essays →
        </Link>
      </div>
      <ul className={styles.grid}>
        {posts.map((post, i) => (
          <li key={post.slug}>
            <PostCard post={post} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
