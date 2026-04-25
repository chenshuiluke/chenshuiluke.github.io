import Link from "next/link";
import type { Post } from "@/content";
import styles from "./PostCard.module.css";

// Subtle deterministic accent color per card so the thumbnail tints don't all
// look identical. Cycles gold / blue / pink, matching the design.
const ACCENTS = [
  { gx: "30%", gy: "40%", gc: "rgba(233,199,137,0.22)" },
  { gx: "70%", gy: "50%", gc: "rgba(122,166,255,0.22)" },
  { gx: "50%", gy: "30%", gc: "rgba(255,144,184,0.18)" },
];

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const cover =
    post.cover && typeof post.cover === "object" && "src" in post.cover
      ? (post.cover as { src: string }).src
      : typeof post.cover === "string"
        ? post.cover
        : null;
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
