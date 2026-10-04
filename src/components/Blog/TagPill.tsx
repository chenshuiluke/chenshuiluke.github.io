import Link from "next/link";
import styles from "./TagPill.module.css";

export function TagPill({ tag }: { tag: string }) {
  return (
    <Link
      href={`/blog/tags/${encodeURIComponent(tag)}`}
      className={styles.pill}
    >
      #{tag}
    </Link>
  );
}
