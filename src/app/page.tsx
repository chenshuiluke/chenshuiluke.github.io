import WavyLine from "./components/wavy_line/wavy_line";
import Nav from "./components/nav/nav";
import Cloud from "./components/cloud/cloud";
import Star from "./components/star/star";

export default function Home() {
  return (
    <main className="">
      <Nav />
      <div className="space-section rounded-lg mx-20 relative">
        {Array.from(Array(1000).keys()).map((index) => {
          const left = Math.floor(Math.random() * (100 + 1));
          const top = Math.floor(Math.random() * (100 + 1));
          return <Star key={index} left={left} top={top} />;
        })}
        {/* <Cloud /> */}
      </div>
    </main>
  );
}
