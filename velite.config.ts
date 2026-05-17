import { defineConfig, defineCollection, s } from "velite";
import readingTime from "reading-time";
import rehypePrettyCode from "rehype-pretty-code";
import { writeFileSync } from "node:fs";
import { Feed } from "feed";
import path from "node:path";

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.{md,mdx}",
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug("posts").optional(),
      path: s.path(),
      date: s.isodate(),
      updated: s.isodate().optional(),
      tags: s.array(s.string()).default([]),
      summary: s.string().max(280),
      cover: s.image().optional(),
      draft: s.boolean().default(false),
      metadata: s.metadata(),
      body: s.mdx(),
      raw: s.raw(),
    })
    .transform((data) => {
      const slug =
        data.slug ||
        data.path
          .split("/")
          .pop()!
          .replace(/\.mdx?$/, "")
          .replace(/^\d{4}-\d{2}-\d{2}-/, "");
      return {
        ...data,
        slug,
        permalink: `/blog/${slug}`,
        readingTime: readingTime(data.raw).text,
      };
    }),
});

const authors = defineCollection({
  name: "Author",
  pattern: "authors/*.json",
  schema: s.object({
    name: s.string(),
    slug: s.slug("authors"),
    avatar: s.image().optional(),
    bio: s.string().optional(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts, authors },
  mdx: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: false,
        },
      ],
    ],
  },
  prepare: (data) => {
    // strip drafts in production
    if (process.env.NODE_ENV === "production") {
      data.posts = data.posts.filter((p: any) => !p.draft);
    }
  },
  complete: ({ posts }) => {
    // Generate RSS feed at build into public/rss.xml
    const siteUrl = process.env.SITE_URL || "https://chenshuiluke.github.io";
    const feed = new Feed({
      title: "Luke Chen Shui — Blog",
      description: "Posts by Luke Chen Shui",
      id: siteUrl,
      link: siteUrl,
      language: "en",
      copyright: `All rights reserved ${new Date().getFullYear()}, Luke Chen Shui`,
      feedLinks: { rss2: `${siteUrl}/rss.xml` },
    });
    posts
      .slice()
      .sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date))
      .forEach((p: any) => {
        feed.addItem({
          title: p.title,
          id: `${siteUrl}${p.permalink}`,
          link: `${siteUrl}${p.permalink}`,
          description: p.summary,
          date: new Date(p.date),
          category: (p.tags || []).map((t: string) => ({ name: t })),
        });
      });
    writeFileSync(
      path.join(process.cwd(), "public", "rss.xml"),
      feed.rss2(),
      "utf8",
    );
  },
});
