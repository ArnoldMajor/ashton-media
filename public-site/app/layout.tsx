import type { Metadata } from "next";
import { Inter, Montserrat, Playfair_Display, Syne } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: "Ashton Media — Tanzania's #1 OOH Network",
  description:
    "Tanzania's largest out-of-home advertising network — 500+ sites across roads, malls, bus stands and airports.",
  keywords: ["OOH advertising", "Tanzania", "billboard", "digital signage"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${syne.variable} ${inter.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
