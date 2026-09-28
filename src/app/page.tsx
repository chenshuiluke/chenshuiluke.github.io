import { AnimatedCard } from "@/components/AnimatedCard/AnimatedCard";
import { AuroraRibbons } from "@/components/AuroraRibbons/AuroraRibbons";
import { Avatar } from "@/components/Avatar/Avatar";
import { BigNebulas } from "@/components/BigNebulas/BigNebulas";
import { ChapterHero } from "@/components/ChapterHero/ChapterHero";
import { ChapterSky } from "@/components/ChapterSky/ChapterSky";
import { SpaceSimulation } from "@/components/Comets/SpaceSimulation";
import { DistantPlanet } from "@/components/DistantPlanet/DistantPlanet";
import { DotStars } from "@/components/DotStars/DotStars";
import { FloatingColumn } from "@/components/FloatingColumn/FloatingColumn";
import { FloatingObject } from "@/components/FloatingObject/FloatingObject";
import { Footer } from "@/components/Footer/Footer";
import { GlowStars } from "@/components/GlowStars/GlowStars";
import { Hero } from "@/components/Hero/Hero";
import { MoonPhase } from "@/components/MoonPhase/MoonPhase";
import { Nav } from "@/components/Nav/Nav";
import { ParallaxStars } from "@/components/ParallaxStars/ParallaxStars";
import { RecentPosts } from "@/components/RecentPosts/RecentPosts";
import { Scene } from "@/components/Scene/Scene";
import { ScrollChapter } from "@/components/ScrollChapter/ScrollChapter";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";
import { Sparkles } from "@/components/Sparkles/Sparkles";
import { CrescentMoon } from "@/components/svg/CrescentMoon";
import { Planet } from "@/components/svg/Planet";
import { PixelPlanet } from "@/components/svg/PixelPlanet";
import {
  ABOUT_LIPSUM,
  ABOUT_QUOTES,
  CONTACT_LIPSUM,
  CONTACT_QUOTES,
  WORK_LIPSUM,
  WORK_QUOTES,
} from "@/lib/lipsum";

export default function Home() {
  return (
    <Scene>
      <SpaceBackground />
      <BigNebulas />
      <AuroraRibbons />
      <GlowStars />
      <ParallaxStars />
      <DotStars />
      <Sparkles />
      <SpaceSimulation />
      <Nav />

      <ChapterHero>
        <MoonPhase />
        <DistantPlanet />
        <Avatar />
        <Hero />
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
        <RecentPosts />
      </ChapterHero>

      <ScrollChapter
        id="work"
        scenery={<ChapterSky chapter="work" />}
        eyebrow="01 — Work"
        title="Things I've shipped."
        body={<p>{WORK_LIPSUM}</p>}
        cards={
          <>
            {WORK_QUOTES.map((q, i) => (
              <AnimatedCard key={q.name} {...q} delay={i} />
            ))}
          </>
        }
      />

      <ScrollChapter
        id="about"
        scenery={<ChapterSky chapter="about" />}
        eyebrow="02 — About"
        title="Who's behind the keys."
        body={
          <FloatingColumn>
            <p>{ABOUT_LIPSUM}</p>
          </FloatingColumn>
        }
        cards={
          <>
            {ABOUT_QUOTES.map((q, i) => (
              <AnimatedCard key={q.name} {...q} delay={i} />
            ))}
          </>
        }
      />

      <ScrollChapter
        id="contact"
        scenery={<ChapterSky chapter="contact" />}
        eyebrow="03 — Contact"
        title="Beam me a message."
        body={<p>{CONTACT_LIPSUM}</p>}
        cards={
          <>
            {CONTACT_QUOTES.map((q, i) => (
              <AnimatedCard key={q.name} {...q} delay={i} />
            ))}
          </>
        }
      />

      <Footer />
    </Scene>
  );
}
