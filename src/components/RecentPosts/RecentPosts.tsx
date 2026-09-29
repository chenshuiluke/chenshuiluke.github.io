import { posts } from "@/content";
import { PostHighlights } from "./PostHighlights";

export function RecentPosts() {
  const latest = [...posts]
    .filter((post) => !post.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 3)
    .map(({ title, summary, permalink }) => ({ title, summary, permalink }));

  return latest.length ? <PostHighlights posts={latest} /> : null;
}
