// Re-export Velite's generated content so app code can use a stable import path.
// Velite writes `.velite/` at the repo root before `next build` runs.
export * from "../../.velite";
export type { Post, Author } from "../../.velite";
