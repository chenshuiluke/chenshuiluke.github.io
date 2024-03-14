import WavyLine from "./components/wavy_line/wavy_line";
import Nav from "./components/nav/nav";
import Cloud from "./components/cloud/cloud";

export default function Home() {
  return (
    <main className="">
      <Nav />
      <div className="space-section rounded-lg mx-20">
        <Cloud />
      </div>
    </main>
  );
}
