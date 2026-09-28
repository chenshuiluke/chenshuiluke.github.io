export const planetMaps = {
  ocean: "/space/planet-ocean-map.webp",
  volcanic: "/space/planet-lava-map.webp",
  gold: "/space/planet-gold-map.webp",
  jade: "/space/planet-jade-map.webp",
  moon: "/space/moon-silver-map.webp",
};
export type PlanetKind = keyof typeof planetMaps;

// Precompute spherical projection and fixed upper-left light, not trig per frame.
export function spherePixels(size: number, moon = false) {
  const pixels = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / (size / 2 - 1);
      const ny = (y + 0.5 - size / 2) / (size / 2 - 1);
      const radius = nx * nx + ny * ny;
      if (radius > 1) continue;
      const z = Math.sqrt(1 - radius);
      const diffuse = -0.6 * nx - 0.38 * ny + (moon ? 0.6 : 0.7) * z;
      const light = Math.max(
        moon ? 0.24 : 0.08,
        Math.min(1, Math.round((diffuse + ((x + y) % 2) * 0.055) * 7) / 7),
      );
      pixels.push({
        offset: (y * size + x) * 4,
        u: Math.atan2(nx, z) / (Math.PI * 2) + 0.5,
        v: Math.asin(ny) / Math.PI + 0.5,
        light,
      });
    }
  }
  return pixels;
}

export function paintPlanet(
  output: Uint8ClampedArray,
  texture: Uint8ClampedArray,
  width: number,
  height: number,
  pixels: ReturnType<typeof spherePixels>,
  turn: number,
) {
  const longitude = ((turn % 1) + 1) % 1;
  for (const { offset, u, v, light } of pixels) {
    let x = Math.floor((u + longitude) * width);
    if (x >= width) x -= width;
    const y = Math.min(height - 1, Math.floor(v * height));
    const source = (y * width + x) * 4;
    // Shared plum night-side colors keep all the worlds in one palette.
    output[offset] = texture[source] * light + 34 * (1 - light);
    output[offset + 1] = texture[source + 1] * light + 28 * (1 - light);
    output[offset + 2] = texture[source + 2] * light + 47 * (1 - light);
    output[offset + 3] = 255;
  }
}
