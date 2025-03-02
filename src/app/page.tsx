import Nav from "./components/nav/nav";
import Cloud from "./components/cloud/cloud";
import StarContainer from "./components/star/star_container";
import PlanetContainer from "./components/planet/planet_container";

export default function Home() {
  return (
    <main className="">
      <div className="space-section">
        <Nav />
        <StarContainer />
        <PlanetContainer />
        <Cloud />
      </div>
    </main>
  );
}
