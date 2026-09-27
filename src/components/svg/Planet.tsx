import { PixelPlanet } from "./PixelPlanet";

export function Planet({ volcanic = false }: { volcanic?: boolean }) {
  return <PixelPlanet kind={volcanic ? "volcanic" : "ocean"} />;
}
