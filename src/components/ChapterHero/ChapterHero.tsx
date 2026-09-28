import type { ReactNode } from "react";
import styles from "./ChapterHero.module.css";

export function ChapterHero({ children }: { children: ReactNode }) {
  return (
    <div className={styles.hero} data-gravity-system>
      <svg
        className={styles.aurora}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-aurora-cool" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#58e3da" stopOpacity="0" />
            <stop offset=".3" stopColor="#57dbc9" stopOpacity=".6" />
            <stop offset=".6" stopColor="#7585ff" stopOpacity=".5" />
            <stop offset="1" stopColor="#c48cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-aurora-warm" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#91a3ff" stopOpacity="0" />
            <stop offset=".45" stopColor="#9581e8" stopOpacity=".65" />
            <stop offset=".72" stopColor="#e78dbd" stopOpacity=".35" />
            <stop offset="1" stopColor="#e78dbd" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className={styles.auroraCool}>
          <path
            d="M-96 420H-72V432H-48V432H-24V444H0V444H12V444H36V444H60V432H72V432H96V420H108V408H132V396H144V396H156V372H180V360H192V348H204V336H228V324H240V312H252V288H276V276H288V264H312V252H324V240H348V228H372V216H384V204H408V192H432V192H456V180H480V180H504V180H540V180H540V180H564V180H588V192H612V192H648V204H672V204H696V216H720V216H744V228H768V228H804V240H828V240H852V252H876V252H900V264H924V264H960V264H984V264H1008V276H1044V276H1068V276H1104V276H1140V264H1176V264H1212V252H1248V252H1284V240H1320V228H1356V216H1404V204H1452V180H1488V168H1536V144"
            stroke="url(#hero-aurora-cool)"
            strokeWidth="65"
          />
          <path
            d="M-96 436H-72V448H-48V448H-24V460H0V460H12V460H36V460H60V448H72V448H96V436H108V424H132V412H144V412H156V388H180V376H192V364H204V352H228V340H240V328H252V304H276V292H288V280H312V268H324V256H348V244H372V232H384V220H408V208H432V208H456V196H480V196H504V196H540V196H540V196H564V196H588V208H612V208H648V220H672V220H696V232H720V232H744V244H768V244H804V256H828V256H852V268H876V268H900V280H924V280H960V280H984V280H1008V292H1044V292H1068V292H1104V292H1140V280H1176V280H1212V268H1248V268H1284V256H1320V244H1356V232H1404V220H1452V196H1488V184H1536V160"
            stroke="url(#hero-aurora-cool)"
            strokeWidth="9"
          />
        </g>
        <g className={styles.auroraWarm}>
          <path
            d="M-120 888H-84V864H-48V840H-24V828H12V816H36V804H72V792H108V780H132V780H168V768H192V768H216V768H252V768H276V768H312V768H336V780H372V780H396V780H420V780H456V780H480V792H516V792H540V792H576V792H600V792H636V780H660V780H696V780H732V768H756V756H792V744H828V732H864V708H864V708H888V684H924V672H960V648H984V636H1008V624H1032V612H1056V600H1080V588H1092V576H1116V564H1140V564H1152V552H1176V552H1188V540H1200V540H1224V540H1236V540H1248V540H1260V540H1284V540H1296V540H1320V540H1332V552H1356V552H1368V564H1392V564H1416V576H1440V576H1464V588H1488V600H1512V612H1536V624"
            stroke="url(#hero-aurora-warm)"
            strokeWidth="85"
          />
          <path
            d="M-120 872H-84V848H-48V824H-24V812H12V800H36V788H72V776H108V764H132V764H168V752H192V752H216V752H252V752H276V752H312V752H336V764H372V764H396V764H420V764H456V764H480V776H516V776H540V776H576V776H600V776H636V764H660V764H696V764H732V752H756V740H792V728H828V716H864V692H864V692H888V668H924V656H960V632H984V620H1008V608H1032V596H1056V584H1080V572H1092V560H1116V548H1140V548H1152V536H1176V536H1188V524H1200V524H1224V524H1236V524H1248V524H1260V524H1284V524H1296V524H1320V524H1332V536H1356V536H1368V548H1392V548H1416V560H1440V560H1464V572H1488V584H1512V596H1536V608"
            stroke="url(#hero-aurora-warm)"
            strokeWidth="8"
          />
        </g>
      </svg>
      <div className={styles.nebulaVeil} aria-hidden="true" />
      <svg
        className={styles.constellations}
        viewBox="0 0 1440 900"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="#a9c9ef" strokeWidth="1">
          <path d="M85 460 150 410 222 444 196 524 285 560" />
          <path d="M1090 190 1160 150 1234 204 1200 286 1310 316" />
          <path d="M330 735 393 698 452 754" />
        </g>
        <g fill="#dbe9ff">
          {[
            [85, 460],
            [150, 410],
            [222, 444],
            [196, 524],
            [285, 560],
            [1090, 190],
            [1160, 150],
            [1234, 204],
            [1200, 286],
            [1310, 316],
            [330, 735],
            [393, 698],
            [452, 754],
          ].map(([cx, cy]) => (
            <rect
              key={`${cx}-${cy}`}
              x={cx - 2}
              y={cy - 2}
              width="4"
              height="4"
            />
          ))}
        </g>
      </svg>
      {children}
      <a className={styles.explore} href="#work" aria-label="Scroll to my work">
        <span aria-hidden="true">↓</span>
      </a>
    </div>
  );
}
