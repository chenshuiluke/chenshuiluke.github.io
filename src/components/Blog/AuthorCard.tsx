import Image from "next/image";
import styles from "./AuthorCard.module.css";

export function AuthorCard({
  name,
  bio,
  avatar = "/luke-avatar.png",
  followHref,
}: {
  name: string;
  bio?: string;
  avatar?: string;
  followHref?: string;
}) {
  return (
    <aside className={styles.card}>
      <div className={styles.avatar}>
        <Image src={avatar} alt={name} width={64} height={64} />
      </div>
      <div className={styles.who}>
        <div className={styles.name}>{name}</div>
        {bio && <div className={styles.bio}>{bio}</div>}
      </div>
      {followHref && (
        <a className={styles.follow} href={followHref}>
          Follow
        </a>
      )}
    </aside>
  );
}
