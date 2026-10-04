import { PixelPlanet } from "@/components/Svg/PixelPlanet";
import styles from "./ChapterSky.module.css";

export function ChapterSky({
  chapter,
}: {
  chapter: "work" | "about" | "contact";
}) {
  return (
    <div
      className={`${styles.sky} ${styles[chapter]}`}
      data-chapter-sky={chapter}
      data-gravity-system
      aria-hidden="true"
    >
      <div className={`${styles.orb} ${styles.large}`}>
        <PixelPlanet kind={chapter === "about" ? "jade" : "gold"} />
      </div>
      <div className={`${styles.orb} ${styles.small}`}>
        <PixelPlanet kind="moon" />
      </div>
      <div className={`${styles.orb} ${styles.medium}`}>
        <PixelPlanet kind={chapter === "contact" ? "volcanic" : "ocean"} />
      </div>
    </div>
  );
}
