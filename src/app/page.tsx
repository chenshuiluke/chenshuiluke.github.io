import { AnimatedCard } from "@/components/AnimatedCard/AnimatedCard";
import { Avatar } from "@/components/Avatar/Avatar";
import { ChapterHero } from "@/components/ChapterHero/ChapterHero";
import { Comets } from "@/components/Comets/Comets";
import { DotStars } from "@/components/DotStars/DotStars";
import { FloatingColumn } from "@/components/FloatingColumn/FloatingColumn";
import { FloatingObject } from "@/components/FloatingObject/FloatingObject";
import { Footer } from "@/components/Footer/Footer";
import { Hero } from "@/components/Hero/Hero";
import { Nav } from "@/components/Nav/Nav";
import { ParallaxStars } from "@/components/ParallaxStars/ParallaxStars";
import { Rocket } from "@/components/Rocket/Rocket";
import { Scene } from "@/components/Scene/Scene";
import { ScrollChapter } from "@/components/ScrollChapter/ScrollChapter";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";
import { SpaceLandscape } from "@/components/SpaceLandscape/SpaceLandscape";
import { Sparkles } from "@/components/Sparkles/Sparkles";
import { CrescentMoon } from "@/components/svg/CrescentMoon";
import { Planet } from "@/components/svg/Planet";
import { Satellite } from "@/components/svg/Satellite";
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
      <SpaceLandscape />
      <ParallaxStars />
      <Nav />

      <ChapterHero>
        <SpaceBackground />
        <Avatar />
        <Hero />
        <Rocket />
        <FloatingObject
          style={{ top: "18%", left: "6%" }}
          dur="11s"
          delay="2.5s"
          ty="10px"
          r0="8deg"
          r1="16deg"
        >
          <Satellite />
        </FloatingObject>
        <FloatingObject
          style={{ top: "68%", right: "20%" }}
          dur="13s"
          delay="1s"
          ty="-8px"
          r0="-4deg"
          r1="4deg"
        >
          <CrescentMoon />
        </FloatingObject>
        <FloatingObject
          style={{ bottom: "5%", right: "3%" }}
          dur="15s"
          delay="2s"
          ty="-5px"
        >
          <Planet />
        </FloatingObject>
        <Comets />
        <Sparkles />
        <DotStars />
      </ChapterHero>

      <ScrollChapter
        id="work"
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
