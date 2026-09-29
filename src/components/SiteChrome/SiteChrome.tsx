import type { ReactNode } from "react";
import { SpaceSimulation } from "@/components/Comets/SpaceSimulation";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import { ParallaxStars } from "@/components/ParallaxStars/ParallaxStars";
import { Scene } from "@/components/Scene/Scene";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <Scene>
      <SpaceBackground />
      <ParallaxStars />
      <SpaceSimulation />
      <Nav />
      {children}
      <Footer />
    </Scene>
  );
}
