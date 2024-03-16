import WavyLine from "./components/wavy_line/wavy_line";
import Nav from "./components/nav/nav";
import Cloud from "./components/cloud/cloud";
import Image from "next/image";

export default function Home() {
  return (
    <main className="">
      <Nav />
      <div className="space-section rounded-lg mx-20">
        {/* <Image className="corner-border" src={'/images/corner.png'} width={200} height={200} alt="Cloud corner"/> */}
        <Cloud />
        

      </div>
    </main>
  );
}
