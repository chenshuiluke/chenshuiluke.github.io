import Image from "next/image";
import styles from "./Avatar.module.css";

export function Avatar() {
  return (
    <div className={styles.wrap}>
      <Image
        src="/luke-avatar.png"
        alt="Luke"
        width={440}
        height={440}
        priority
      />
    </div>
  );
}
