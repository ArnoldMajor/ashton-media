import { getBillboardsResult } from "@/lib/api/billboards";
import { getSiteContent, heroImages } from "@/lib/api/site-content";
import NetworkShowcase from "@/components/home/NetworkShowcase";
import { mixSites } from "@/lib/mix-sites";
import HomeClient from "./HomeClient";

/** Cards in the home page's "Available Now" preview. */
const PREVIEW_COUNT = 3;

const MS_PER_DAY = 86_400_000;

export default async function HomePage() {
  const [{ billboards, source }, content] = await Promise.all([getBillboardsResult(), getSiteContent()]);

  // The preview is chosen here, on the server, and passed down as plain props:
  // the seed is the UTC day number, and reading the clock while the browser
  // renders could pick different sites from the HTML and break hydration.
  // eslint-disable-next-line react-hooks/purity -- a Server Component: this runs once per build or revalidation, never in the browser
  const seed = Math.floor(Date.now() / MS_PER_DAY);
  const previewSites = mixSites(billboards.filter((b) => b.isAvailable), PREVIEW_COUNT, seed);

  return (
    <HomeClient
      billboards={billboards}
      previewSites={previewSites}
      usingFallback={source === "fallback"}
      heroImages={heroImages(content)}
      networkShowcase={<NetworkShowcase />}
    />
  );
}
