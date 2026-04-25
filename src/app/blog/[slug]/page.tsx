import { posts } from "@/content";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Mdx } from "@/components/blog/Mdx";
import { TagPill } from "@/components/blog/TagPill";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { ContinueReading } from "@/components/blog/ContinueReading";
import styles from "../blog.module.css";

const AUTHOR = {
  name: "Luke Chen Shui",
  bio: "Full Stack Software Engineer in Jamaica. Writes about games, fragrances, tools, photography, anime and other random stuff.",
  followHref: "https://github.com/chenshuiluke",
};

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — Luke Chen Shui`,
    description: post.summary,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function coverSrc(cover: unknown): string | null {
  if (!cover) return null;
  if (typeof cover === "string") return cover;
  if (typeof cover === "object" && cover && "src" in cover) {
    return (cover as { src: string }).src;
  }
  return null;
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const others = posts
    .filter((p) => p.slug !== post.slug && !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 3);

  const kicker = post.tags[0]
    ? `Field Notes · ${post.tags[0]}`
    : "Field Notes";
  const cover = coverSrc(post.cover);

  return (
    <>
      <ReadingProgress />
      <main className={styles.postWrap}>
        <Link href="/blog" className={styles.back}>
          <span className={styles.arrow} aria-hidden="true">←</span>
          Back to blog
        </Link>

        <header className={styles.masthead}>
          <div className={styles.kicker}>{kicker}</div>
          <h1 className={styles.title}>{post.title}</h1>
          {post.summary && <p className={styles.deck}>{post.summary}</p>}
          <div className={styles.byline}>
            <span>
              By <span className={styles.author}>{AUTHOR.name}</span>
            </span>
            <span className={styles.dot} />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className={styles.dot} />
            <span>{post.readingTime}</span>
          </div>
        </header>

        {cover && (
          <figure className={styles.heroFig}>
            <div className={styles.frame}>
              <img src={cover} alt="" />
            </div>
          </figure>
        )}

        <article className={styles.body}>
          <div className={styles.prose}>
            <Mdx code={post.body} />
          </div>
          <div className={styles.endmark}>· · ·</div>
        </article>

        {post.tags.length > 0 && (
          <ul className={styles.postTags}>
            {post.tags.map((t) => (
              <li key={t}>
                <TagPill tag={t} />
              </li>
            ))}
          </ul>
        )}

        <AuthorCard
          name={AUTHOR.name}
          bio={AUTHOR.bio}
          followHref={AUTHOR.followHref}
        />

        <ContinueReading posts={others} />
      </main>
    </>
  );
}
