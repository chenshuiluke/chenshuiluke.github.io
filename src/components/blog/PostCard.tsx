import Link from "next/link";
import type { Post } from "@/content";
import styles from "./PostCard.module.css";

export function PostCard({ post }: { post: Post }) {
  const primaryTag = post.tags[0];
  return (
    <Link href={post.permalink} className={styles.card}>
      
      {primaryTag && (
        <div className={styles.tag}>
          {primaryTag} · {post.readingTime}
        </div>
      )}
      <h4 className={styles.title}>{post.title}</h4>
      <p className={styles.summary}>{post.summary}</p>
      <div className={styles.meta}>
        {new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </Link>
  );
}
