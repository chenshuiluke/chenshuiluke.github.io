import { Fragment } from "react";

// Real text and normal word wrapping stay intact; only the visual spans move.
export function GravityText({ children }: { children: string }) {
  return children.split(/(\s+)/).map((part, i) => (
    <Fragment key={i}>{/\s/.test(part) ? part : <span data-hole-text>{part}</span>}</Fragment>
  ));
}
