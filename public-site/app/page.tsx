import { getBillboardsResult } from "@/lib/api/billboards";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const { billboards, source } = await getBillboardsResult();
  return <HomeClient billboards={billboards} usingFallback={source === "fallback"} />;
}
