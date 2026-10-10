import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

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
    <html lang="en" className={montserrat.variable}>
      <body suppressHydrationWarning>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
