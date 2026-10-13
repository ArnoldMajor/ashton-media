import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import { getSiteContent, slotImage } from "@/lib/api/site-content";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteMetadata: Metadata = {
  title: "Ashton Media - Tanzania's #1 OOH Network",
  description:
    "Tanzania's largest out-of-home advertising network — 500+ sites across roads, malls, bus stands and airports.",
  keywords: ["OOH advertising", "Tanzania", "billboard", "digital signage"],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};

/**
 * Adds the link-preview image editors set in the admin (Site Images →
 * "Social share image"). With none set, the metadata is exactly what it was.
 *
 * This puts a revalidating fetch in the root layout, so every route, including
 * the ones with no data of their own, is regenerated on the site-content
 * interval rather than built once.
 */
export async function generateMetadata(): Promise<Metadata> {
  const share = slotImage(await getSiteContent(), "site.share");
  if (!share) return siteMetadata;

  const image = {
    url: share.url,
    ...(share.width && share.height ? { width: share.width, height: share.height } : {}),
    ...(share.alt ? { alt: share.alt } : {}),
  };
  return {
    ...siteMetadata,
    openGraph: { images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body suppressHydrationWarning>
        <Nav />
        <main>{children}</main>
        <Footer />
        <ContactDock />
      </body>
    </html>
  );
}
