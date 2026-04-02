import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Luke Chen Shui",
  description: "Luke Chen Shui - Software Engineer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <script
  id="beacon-ai-loader"
  src="https://dev-beacon-ai.vercel.app/api/widget/loader.js"
  data-chatbot-id="556ac132-73e5-4140-9121-140d4b15a608"
  data-api-key="8931772dd236204427d036302259c5d0b237756cbeb2b8e7400f8465d284ade9"
></script>
    </html>
  );
}
