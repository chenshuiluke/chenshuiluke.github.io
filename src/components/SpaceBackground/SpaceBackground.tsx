import styles from "./SpaceBackground.module.css";

const NEBULAS = [
  { width: 450, height: 350, top: "3%", left: "5%", color: "#1a3a60", opacity: 0.1, delay: "0s" },
  { width: 380, height: 300, top: "12%", right: "2%", color: "#2a1a60", opacity: 0.09, delay: "3s" },
  { width: 500, height: 400, top: "22%", left: "20%", color: "#183050", opacity: 0.1, delay: "5s" },
  { width: 420, height: 320, top: "35%", right: "8%", color: "#22184a", opacity: 0.09, delay: "1s" },
  { width: 480, height: 380, top: "48%", left: "10%", color: "#1a2c5a", opacity: 0.1, delay: "4s" },
  { width: 360, height: 290, top: "60%", right: "15%", color: "#2c1a55", opacity: 0.1, delay: "2s" },
  { width: 460, height: 360, top: "72%", left: "8%", color: "#162a52", opacity: 0.09, delay: "6s" },
  { width: 400, height: 320, top: "85%", right: "10%", color: "#241b50", opacity: 0.1, delay: "3.5s" },
];

export function SpaceBackground() {
  return (
    <>
      <div className={styles.spaceBg} />
      {NEBULAS.map((n, i) => (
        <div
          key={i}
          className={styles.neb}
          style={{
            width: n.width,
            height: n.height,
            top: n.top,
            ...(n.left ? { left: n.left } : {}),
            ...(n.right ? { right: n.right } : {}),
            background: n.color,
            opacity: n.opacity,
            animationDelay: n.delay,
          }}
        />
      ))}
    </>
  );
}
