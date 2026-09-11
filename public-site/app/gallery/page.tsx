import { getLocationsResult } from "@/lib/locations";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage() {
  const { locations, source } = await getLocationsResult();
  return <GalleryClient locations={locations} usingFallback={source === "fallback"} />;
}
