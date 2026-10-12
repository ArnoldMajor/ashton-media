import { getBillboardsResult } from "@/lib/api/billboards";
import { getSiteContent, heroImages } from "@/lib/api/site-content";
import NetworkShowcase from "@/components/home/NetworkShowcase";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const [{ billboards, source }, content] = await Promise.all([getBillboardsResult(), getSiteContent()]);
  return (
    <HomeClient
      billboards={billboards}
      usingFallback={source === "fallback"}
      heroImages={heroImages(content)}
      networkShowcase={<NetworkShowcase />}
    />
  );
}
