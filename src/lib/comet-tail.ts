// Increasing time carries each crest left, away from the fixed nucleus.
export function cometTailOffset(x: number, seconds: number, bend = 0) {
  if (x >= 144) return 0;
  const distance = Math.max(0, (144 - x) / 144);
  return (
    Math.sin(x / 17 + seconds * 7) * 8 * distance ** 1.2 + bend * distance ** 2
  );
}

export function cometParticle(index: number, seconds: number, bend = 0) {
  const age = (seconds * (0.8 + (index % 5) * 0.07) + index * 0.618034) % 1;
  const x = 143 - age * 150;
  const lane = index % 2;
  return {
    x,
    y:
      16 +
      39 +
      lane * 4 -
      age * (lane ? 23 : 29) +
      Math.sin(index * 3.7) * (2 + age * 8) +
      cometTailOffset(Math.max(0, x), seconds, bend),
    alpha: Math.sin(Math.PI * age) * 0.9,
    length: 2 + Math.floor(age * 4),
  };
}

// Paint the same 192x96 frame in the browser and in the downloadable motion preview.
export function paintComet(
  output: Uint8ClampedArray,
  source: Uint8ClampedArray,
  seconds: number,
  bend = 0,
) {
  output.fill(0);
  for (let x = 0; x < 192; x++) {
    const tail = x < 144;
    const offset = Math.round(cometTailOffset(x, seconds, bend));
    const pulse = tail ? ((1 + Math.sin(x / 9 + seconds * 12)) / 2) ** 4 : 0;
    const brightness = tail
      ? 1 + (-0.28 + pulse * 0.65) * Math.min(1, (144 - x) / 30)
      : 1;
    for (let y = 0; y < 64; y++) {
      const src = (y * 192 + x) * 4;
      const dst = ((y + 16 + offset) * 192 + x) * 4;
      for (let channel = 0; channel < 3; channel++)
        output[dst + channel] = source[src + channel] * brightness;
      output[dst + 3] = source[src + 3];
    }
  }
  const colors = [
    [185, 250, 255],
    [220, 193, 255],
    [255, 232, 176],
  ];
  for (let i = 0; i < 36; i++) {
    const particle = cometParticle(i, seconds, bend);
    const color = colors[i % colors.length];
    for (let dx = 0; dx < particle.length; dx++) {
      for (let dy = 0; dy < (i % 3 === 0 ? 2 : 1); dy++) {
        const x = Math.floor(particle.x) + dx,
          y = Math.floor(particle.y) + dy;
        if (x < 0 || x >= 144 || y < 0 || y >= 96) continue;
        const dst = (y * 192 + x) * 4;
        const alpha = particle.alpha * (1 - dx / particle.length);
        const oldAlpha = output[dst + 3] / 255;
        const newAlpha = alpha + oldAlpha * (1 - alpha);
        if (!newAlpha) continue;
        for (let channel = 0; channel < 3; channel++) {
          output[dst + channel] =
            (color[channel] * alpha +
              output[dst + channel] * oldAlpha * (1 - alpha)) /
            newAlpha;
        }
        output[dst + 3] = newAlpha * 255;
      }
    }
  }
}
