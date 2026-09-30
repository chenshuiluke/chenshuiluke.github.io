import Image from "next/image";
import styles from "./Avatar.module.css";

export function Avatar() {
  return (
    <div className={styles.wrap} data-space-avatar>
      <Image
        src="/luke-avatar-pixel-cutout.png"
        alt="Luke"
        width={440}
        height={440}
        priority
      />
      <svg className={styles.reaction} viewBox="0 0 1254 1254" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        <defs>
          <clipPath id="avatar-left-eye">
            <path d="M519 461H545V466H557V477H571V513H560V526H543V534H527V526H516V515H507V481H513V469H519Z" />
          </clipPath>
          <clipPath id="avatar-right-eye">
            <path d="M682 444H726V450H742V459H752V505H740V519H720V528H698V520H683V508H673V492H667V468H674V453H682Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#avatar-left-eye)">
          <path d="M500 450H580V540H500Z" fill="#fff5d5" />
          <path d="M500 517H580V540H500Z" fill="#ead4a7" />
          <g data-avatar-pupil>
            <g className={styles.iris}>
              <path d="M534 466H553V473H563V484H569V510H561V522H540V517H531V506H525V480H534Z" fill="#111329" />
              <path d="M534 473H541V492H534V507H529V481H534Z" fill="#536487" />
              <path d="M541 515H558V522H541Z" fill="#304b7b" />
              <path d="M536 473H544V481H536ZM555 491H563V500H555Z" fill="#fffbe8" />
            </g>
          </g>
        </g>
        <g clipPath="url(#avatar-right-eye)">
          <path d="M660 437H763V537H660Z" fill="#fff5d5" />
          <path d="M660 511H763V537H660Z" fill="#ead4a7" />
          <g data-avatar-pupil>
            <g className={styles.iris}>
              <path d="M697 450H722V457H735V466H743V497H736V513H721V522H698V515H688V501H683V474H690V460H697Z" fill="#101329" />
              <path d="M690 461H700V480H692V499H686V474H690Z" fill="#526589" />
              <path d="M700 511H728V519H700Z" fill="#304b7b" />
              <path d="M698 458H708V470H698ZM724 479H736V491H724Z" fill="#fffbe8" />
            </g>
          </g>
        </g>
        <g className={styles.worry}>
          <path d="M596 585H694V621H596Z" fill="#fcbe75" />
          <path d="M608 610H618V603H632V597H653V603H668V609H678V618H668V613H654V608H632V612H619V618H608Z" fill="#18172b" />
          <path d="M799 404H806V417H812V431H818V446H812V453H799V447H794V434H797V420H799Z" fill="#5fbfdd" />
          <path d="M800 422H805V440H800Z" fill="#e3f8e9" />
        </g>
      </svg>
    </div>
  );
}
