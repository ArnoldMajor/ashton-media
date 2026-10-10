import { getBillboardsResult } from "@/lib/api/billboards";
import GalleryClient from "./GalleryClient";

export default async function GalleryPage() {
  const { billboards, source } = await getBillboardsResult();
  return <GalleryClient billboards={billboards} usingFallback={source === "fallback"} />;
}
