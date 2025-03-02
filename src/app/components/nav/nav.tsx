import localFont from "next/font/local";
import Link from "next/link";

const madimiOne = localFont({
  src: "../..//assets/fonts/MadimiOne-Regular.ttf",
  display: "swap",
});

const Nav = () => {
  return (
    <div className="flex w-full p-5 px-20">
      <Link href="/" className={`nav-link ${madimiOne.className}`}>
        Luke Chen Shui
      </Link>
    </div>
  );
};

export default Nav;
