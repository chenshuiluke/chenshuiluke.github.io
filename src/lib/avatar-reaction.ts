import type { BlackHole } from "./black-hole";

export function avatarReaction(hole: BlackHole, faceX: number, faceY: number, wasWorried = false) {
  if (hole.strength <= .05) return { x: 0, y: 0, mood: "" };
  const dx = hole.x - faceX, dy = hole.y - faceY;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(1, distance / 100);
  const danger = (wasWorried ? 160 : 125) + (hole.radius ?? 18) * 1.5;
  return {
    x: Math.round(dx / (distance || 1) * reach * 18),
    y: Math.round(dy / (distance || 1) * reach * 12),
    mood: distance < danger && hole.strength > .2 ? "worried" : "watching",
  };
}
