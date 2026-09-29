// Soft scenery is rasterized once, then composited with the stars each frame.
// These retain the original seeded positions, colors, sizes and drift ranges.
export function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const colors = ["#2a4a8a", "#5a2a7a", "#3a2870", "#2a5090", "#5a2070", "#3040a0"];
const random = mulberry32(42);
const clouds = Array.from({ length: 36 }, (_, i) => {
  const width = 500 + random() * 400, height = 380 + random() * 280;
  const top = (i + random()) / 36, left = (-10 + random() * 80) / 100;
  random(); // Original base opacity; the animated pulse overrides it.
  const color = colors[Math.floor(random() * colors.length)];
  const drift = Math.floor(random() * 3);
  const delay = random() * 8, duration = 10 + random() * 6;
  return { width, height, top, left, color, drift, delay, duration };
});
const haze = [
  { width: 450, height: 350, top: .03, left: .05, color: "#1a3a60", delay: 0 },
  { width: 380, height: 300, top: .12, right: .02, color: "#2a1a60", delay: 3 },
  { width: 500, height: 400, top: .22, left: .20, color: "#183050", delay: 5 },
  { width: 420, height: 320, top: .35, right: .08, color: "#22184a", delay: 1 },
  { width: 480, height: 380, top: .48, left: .10, color: "#1a2c5a", delay: 4 },
  { width: 360, height: 290, top: .60, right: .15, color: "#2c1a55", delay: 2 },
  { width: 460, height: 360, top: .72, left: .08, color: "#162a52", delay: 6 },
  { width: 400, height: 320, top: .85, right: .10, color: "#241b50", delay: 3.5 },
];
const glowStars = [
  { top: .24, left: .18, size: 8, color: "#ffd6a0", duration: 3.4, delay: 0 },
  { top: .42, left: .78, size: 6, color: "#aaddff", duration: 4.2, delay: 1 },
  { top: .72, left: .32, size: 9, color: "#ffffff", duration: 5, delay: 2 },
  { top: .18, left: .62, size: 5, color: "#ff9aa9", duration: 3.8, delay: .6 },
  { top: .58, left: .06, size: 7, color: "#c0e0ff", duration: 4.6, delay: 1.4 },
];
const constellationStars = [
  [85, 460], [150, 410], [222, 444], [196, 524], [285, 560],
  [1090, 190], [1160, 150], [1234, 204], [1200, 286], [1310, 316],
  [330, 735], [393, 698], [452, 754],
];

export function createScenery(context: CanvasRenderingContext2D, rich: boolean) {
  // Bake the tiny halo once, rather than repainting 13 animated SVG filters.
  const star = rich ? document.createElement("canvas") : null;
  if (star) {
    star.width = star.height = 32;
    const paint = star.getContext("2d");
    if (paint) {
      paint.fillStyle = "#dbe9ff";
      paint.shadowColor = "#b8d6ff";
      paint.shadowBlur = 8;
      paint.fillRect(14, 14, 4, 4);
    }
  }
  const sprites = new Map<string, HTMLCanvasElement>();
  const sprite = (color: string) => {
    let image = sprites.get(color);
    if (image) return image;
    image = document.createElement("canvas");
    image.width = image.height = 128;
    const paint = image.getContext("2d");
    if (!paint) return image;
    const gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64 * Math.SQRT2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(.25, color + "88");
    gradient.addColorStop(.45, color + "44");
    gradient.addColorStop(.7, color + "00");
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 128, 128);
    sprites.set(color, image);
    return image;
  };
  // Build the small shared palette once, never allocate gradient surfaces mid-frame.
  for (const color of [...haze.map(n => n.color), ...(rich ? [...colors, ...glowStars.map(n => n.color), "#4ad8c0", "#a060ff", "#ff80c0", "#6080ff"] : [])]) sprite(color);
  return (seconds: number, width: number, height: number, worldHeight: number, cameraY: number, still: boolean, heroHeight = 0) => {
    const pulse = (duration: number, delay = 0) => still ? .5 : (1 - Math.cos(Math.max(0, seconds - delay) / duration * Math.PI)) / 2;
    const draw = (color: string, x: number, y: number, w: number, h: number, alpha: number) => {
      if (y + h < 0 || y > height || x + w < 0 || x > width) return;
      context.globalAlpha = alpha;
      context.drawImage(sprite(color), x, y, w, h);
    };
    for (const n of haze) {
      const w = Math.min(width, n.width);
      draw(n.color, n.left === undefined ? width * (1 - (n.right ?? 0)) - w : width * n.left,
        worldHeight * n.top - cameraY, w, n.height, .07 + pulse(9, n.delay) * .11);
    }
    if (rich) {
      for (const n of clouds) {
        const drift = pulse([70, 90, 80][n.drift], n.delay);
        draw(n.color, width * n.left + [60, -50, 40][n.drift] * drift,
          worldHeight * n.top - cameraY + [40, -35, -30][n.drift] * drift,
          n.width, n.height, .15 + pulse(n.duration, n.delay) * .25);
      }
      context.globalCompositeOperation = "screen";
      for (const [top, a, b, duration] of [[.18, "#4ad8c0", "#a060ff", 14], [.54, "#ff80c0", "#6080ff", 18]] as const) {
        const drift = pulse(duration);
        const y = worldHeight * top - cameraY - 40;
        draw(a, -width * .1 - 30 * drift, y - 12 * drift, width * .8, 240, .18);
        draw(b, width * .3 - 30 * drift, y + 12 * drift, width * .8, 240, .18);
      }
      context.globalCompositeOperation = "source-over";
      for (const n of glowStars) {
        const phase = pulse(n.duration, n.delay), size = n.size * (.85 + phase * .25);
        const x = width * n.left, y = worldHeight * n.top - cameraY;
        draw(n.color, x - size * 3, y - size * 3, size * 7, size * 7, .4 + phase * .6);
        if (y >= -size && y <= height) {
          context.globalAlpha = .4 + phase * .6;
          context.fillStyle = n.color;
          context.beginPath();
          context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    if (star && heroHeight > 0 && cameraY < heroHeight) {
      // Match the static SVG's centered viewBox, including its wider mobile sky.
      const scale = Math.min(width * (width <= 540 ? 1.8 : 1) / 1440, heroHeight / 900);
      const left = (width - 1440 * scale) / 2;
      const top = (heroHeight - 900 * scale) / 2 - cameraY;
      constellationStars.forEach(([cx, cy], i) => {
        const x = left + cx * scale, y = top + cy * scale;
        const size = 32 * scale;
        if (x < -size || x > width + size || y < -size || y > height + size) return;
        const delay = i % 3 === 0 ? -4 : i % 3 === 2 ? -2 : 0;
        context.globalAlpha = .62 * (.35 + .65 * pulse(5, delay));
        context.drawImage(star, x - size / 2, y - size / 2, size, size);
      });
    }
    context.globalAlpha = 1;
  };
}
