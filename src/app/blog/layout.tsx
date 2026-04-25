import { SiteChrome } from "@/components/SiteChrome/SiteChrome";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
