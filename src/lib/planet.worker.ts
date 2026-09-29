import { paintPlanet, spherePixels, type PlanetKind } from "./pixel-planets";

type Planet = {
  context: OffscreenCanvasRenderingContext2D;
  texture: Uint8ClampedArray;
  frame: ImageData;
  kind: PlanetKind;
  turn: number;
  active: boolean;
};
const planets = new Map<number, Planet>();
const projections = { planet: spherePixels(96), moon: spherePixels(96, true) };
let request = 0, previous = 0;
function paint(planet: Planet) {
  paintPlanet(planet.frame.data, planet.texture, 384, 192,
    projections[planet.kind === "moon" ? "moon" : "planet"], planet.turn);
  planet.context.putImageData(planet.frame, 0, 0);
}
function tick(now: number) {
  const elapsed = previous ? Math.min(now - previous, 50) : 0;
  previous = now;
  planets.forEach(planet => {
    if (!planet.active) return;
    planet.turn += elapsed / (planet.kind === "volcanic" ? 46000 : 60000);
    paint(planet);
  });
  request = requestAnimationFrame(tick);
}
function sync() {
  if ([...planets.values()].some(planet => planet.active)) {
    if (!request) { previous = 0; request = requestAnimationFrame(tick); }
  } else {
    cancelAnimationFrame(request);
    request = 0;
    previous = 0;
  }
}
self.onmessage = ({ data }) => {
  if (data.type === "init") {
    const context = (data.canvas as OffscreenCanvas).getContext("2d");
    if (!context) return;
    const planet = { context, texture: data.texture, frame: context.createImageData(96, 96),
      kind: data.kind as PlanetKind, turn: data.turn, active: data.active };
    planets.set(data.id, planet);
    paint(planet);
  } else if (data.type === "active") {
    const planet = planets.get(data.id);
    if (planet) planet.active = data.active;
  } else if (data.type === "dispose") planets.delete(data.id);
  sync();
};
self.postMessage({ type: "ready", supported: typeof requestAnimationFrame === "function" });
