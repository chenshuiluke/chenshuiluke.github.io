import Nav from "./components/nav/nav";
import Cloud from "./components/cloud/cloud";
import StarContainer from "./components/star/star_container";
import PlanetContainer from "./components/planet/planet_container";

export default function Home() {
  return (
    <main className="">
      <Nav />

      <div className="space-section rounded-lg mx-20">
        <StarContainer />
        <PlanetContainer />
        <Cloud />
      </div>
    </main>
  );
}
