import { getLocationsResult } from "@/lib/locations";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const { locations, source } = await getLocationsResult();
  return <HomeClient locations={locations} usingFallback={source === "fallback"} />;
}
