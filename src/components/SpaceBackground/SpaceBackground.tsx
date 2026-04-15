import styles from "./SpaceBackground.module.css";

export function SpaceBackground() {
  return (
    <>
      <div className={styles.spaceBg} />
      <div
        className={styles.neb}
        style={{
          width: 450,
          height: 350,
          top: "5%",
          left: "5%",
          background: "#1a3a60",
          opacity: 0.1,
        }}
      />
      <div
        className={styles.neb}
        style={{
          width: 380,
          height: 300,
          top: "40%",
          right: "2%",
          background: "#2a1a60",
          opacity: 0.09,
          animationDelay: "3s",
        }}
      />
      <div
        className={styles.neb}
        style={{
          width: 500,
          height: 400,
          bottom: 0,
          left: "20%",
          background: "#183050",
          opacity: 0.1,
          animationDelay: "5s",
        }}
      />
    </>
  );
}
