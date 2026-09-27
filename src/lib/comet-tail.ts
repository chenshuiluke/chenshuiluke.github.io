// Increasing time carries each crest left, away from the fixed nucleus.
export function cometTailOffset(x: number, seconds: number) {
  if (x >= 144) return 0;
  const distance = Math.max(0, (144 - x) / 144);
  return Math.sin(x / 22 + seconds * 4.5) * 4 * distance ** 1.6;
}
