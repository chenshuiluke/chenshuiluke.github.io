import { Avatar } from "@/components/Avatar/Avatar";
import { Comets } from "@/components/Comets/Comets";
import { DotStars } from "@/components/DotStars/DotStars";
import { FloatingObject } from "@/components/FloatingObject/FloatingObject";
import { Hero } from "@/components/Hero/Hero";
import { Nav } from "@/components/Nav/Nav";
import { Rocket } from "@/components/Rocket/Rocket";
import { Scene } from "@/components/Scene/Scene";
import { SpaceBackground } from "@/components/SpaceBackground/SpaceBackground";
import { Sparkles } from "@/components/Sparkles/Sparkles";
import { CrescentMoon } from "@/components/svg/CrescentMoon";
import { Planet } from "@/components/svg/Planet";
import { Satellite } from "@/components/svg/Satellite";

export default function Home() {
  return (
    <Scene>
      <SpaceBackground />
      <Nav />
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
    </Scene>
  );
}
