import type { ReactNode } from "react";
import { Comets } from "@/components/Comets/Comets";
import { DotStars } from "@/components/DotStars/DotStars";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import { ParallaxStars } from "@/components/ParallaxStars/ParallaxStars";
import { Scene } from "@/components/Scene/Scene";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";
import { Sparkles } from "@/components/Sparkles/Sparkles";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <Scene>
      <SpaceBackground />
      <ParallaxStars />
      <DotStars />
      <Sparkles />
      <Comets />
      <Nav />
      {children}
      <Footer />
    </Scene>
  );
}
