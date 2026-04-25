import { posts } from "@/content";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PostCard } from "@/components/blog/PostCard";
import styles from "../../blog.module.css";

interface Params {
  tag: string;
}

export function generateStaticParams(): Params[] {
  const tags = new Set(posts.flatMap((p) => p.tags));
  return Array.from(tags).map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${decodeURIComponent(tag)} — Blog — Luke Chen Shui`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);

  const matched = posts
    .filter((p) => !p.draft && p.tags.includes(tag))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  if (matched.length === 0) notFound();

  return (
    <main className={styles.page}>
      <Link href="/blog" className={styles.back}>
        ← Back to blog
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>#{tag}</h1>
        <p className={styles.subtitle}>
          {matched.length} post{matched.length === 1 ? "" : "s"}
        </p>
      </header>
      <ul className={styles.list}>
        {matched.map((post) => (
          <li key={post.slug}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </main>
  );
}
