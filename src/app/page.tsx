import { ChapterHero } from "@/components/ChapterHero/ChapterHero";
import { SpaceSimulation } from "@/components/SpaceSimulation/SpaceSimulation";
import { DistantPlanet } from "@/components/DistantPlanet/DistantPlanet";
import { FloatingObject } from "@/components/FloatingObject/FloatingObject";
import { Hero } from "@/components/Hero/Hero";
import { MoonPhase } from "@/components/MoonPhase/MoonPhase";
import { Nav } from "@/components/Nav/Nav";
import { ParallaxStars } from "@/components/ParallaxStars/ParallaxStars";
import { RecentPosts } from "@/components/RecentPosts/RecentPosts";
import { Scene } from "@/components/Scene/Scene";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";
import { CrescentMoon } from "@/components/Svg/CrescentMoon";
import { Planet } from "@/components/Svg/Planet";
import { PixelPlanet } from "@/components/Svg/PixelPlanet";
import { planetMaps } from "@/lib/pixel-planets";

export default function Home() {
  return (
    <Scene>
      {Object.values(planetMaps).map((src) => <link key={src} rel="preload" as="image" href={src} />)}
      <SpaceBackground />
      <ParallaxStars rich />
      <SpaceSimulation />
      <Nav />

      <ChapterHero>
        <MoonPhase />
        <DistantPlanet />
        <FloatingObject
          style={{ top: "18%", left: "2%" }}
          dur="19s"
          delay="-2.5s"
          ty="16px"
          tx="8px"
          r0="-8deg"
          r1="-3deg"
        >
          <PixelPlanet kind="gold" />
        </FloatingObject>
        <FloatingObject
          style={{ top: "26%", right: "1%" }}
          dur="23s"
          delay="-8s"
          ty="-18px"
          tx="-8px"
          r0="12deg"
          r1="16deg"
        >
          <PixelPlanet kind="jade" />
        </FloatingObject>
        <FloatingObject
          style={{ top: "62%", right: "20%" }}
          dur="13s"
          delay="1s"
          ty="-16px"
          tx="-14px"
          r0="-4deg"
          r1="4deg"
        >
          <CrescentMoon />
        </FloatingObject>
        <FloatingObject
          style={{ bottom: "7%", right: "2%" }}
          dur="15s"
          delay="2s"
          ty="-20px"
          tx="-14px"
        >
          <Planet />
        </FloatingObject>
        <main>
          <Hero />
          <RecentPosts />
        </main>
      </ChapterHero>
    </Scene>
  );
}
