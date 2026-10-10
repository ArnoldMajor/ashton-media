import { cache } from "react";
import { SITES, SITE_COORDINATES, type Site } from "@/lib/data";
import { REAL_PHOTOS } from "@/lib/photos";
import {
  KNOWN_BILLBOARD_FORMATS,
  type Billboard,
  type BillboardAPI,
  type BillboardFormat,
  type BillboardStatus,
  type KnownBillboardFormat,
} from "@/types/billboard";
import { apiFetch } from "./client";

const BILLBOARDS_PATH = "/api/billboards/";

// The backend is on Render's free tier: the first request after idle can take
// 30–50s to answer. This fetch only ever runs at build or during a background
// revalidation, never while a visitor waits, so it can afford to sit through a
// cold start. Kept under Next's 60s static-generation limit.
const BILLBOARDS_TIMEOUT_MS = 45_000;

// Tanzania's approximate bounding box — used to sanity-check incoming coordinates.
const LNG_RANGE: [number, number] = [29.3, 40.5];
const LAT_RANGE: [number, number] = [-11.8, -0.9];

const KNOWN_STATUSES: BillboardStatus[] = ["available", "under_maintanance", "unavailable"];

/** Returns the list whether the API sent a bare array or a DRF-paginated object. */
export function unwrapList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (typeof json === "object" && json !== null) {
    const results = (json as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

function toFormat(raw: string): BillboardFormat {
  return (KNOWN_BILLBOARD_FORMATS as readonly string[]).includes(raw) ? (raw as KnownBillboardFormat) : "other";
}

function toStatus(raw: string): BillboardStatus {
  return (KNOWN_STATUSES as string[]).includes(raw) ? (raw as BillboardStatus) : "other";
}

/** "10.00" → "10", "12.50" → "12.5"; null for anything missing or non-numeric. */
function toDimension(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

/**
 * Converts one raw API record into a Billboard. Returns null (and logs a
 * warning) for anything without usable coordinates, so a bad record from the
 * backend can't crash or mis-render the map.
 */
export function adaptBillboard(api: BillboardAPI): Billboard | null {
  const lat = parseFloat(api.latitude);
  const lng = parseFloat(api.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn(`[billboards] dropping "${api.name ?? api.id}" — missing/invalid coordinates`);
    return null;
  }
  if (lng < LNG_RANGE[0] || lng > LNG_RANGE[1] || lat < LAT_RANGE[0] || lat > LAT_RANGE[1]) {
    console.warn(`[billboards] dropping "${api.name ?? api.id}" — coordinates [${lng}, ${lat}] fall outside Tanzania bounds`);
    return null;
  }

  const width = toDimension(api.width_meters);
  const height = toDimension(api.height_meters);

  return {
    id: api.id,
    siteCode: api.site_code ?? "",
    name: api.name,
    format: toFormat(api.format),
    formatLabel: api.format_display || api.format,
    status: toStatus(api.status),
    statusLabel: api.status_display || api.status,
    region: api.region ?? "",
    address: api.address ?? "",
    coordinates: [lng, lat],
    size: width && height ? `${width} × ${height} m` : null,
    illuminated: Boolean(api.illuminated),
    backlit: Boolean(api.backlit),
    imageUrl: api.image || null,
    isAvailable: api.status === "available",
  };
}

const FALLBACK_FORMAT: Record<Site["type"], { format: BillboardFormat; label: string }> = {
  digital: { format: "digital", label: "Digital" },
  traditional: { format: "static", label: "Static" },
  airport: { format: "airport", label: "Airport" },
};

function siteToBillboard(site: Site): Billboard {
  const { format, label } = FALLBACK_FORMAT[site.type];
  return {
    id: site.id,
    siteCode: "",
    name: site.name,
    format,
    formatLabel: label,
    status: site.available ? "available" : "unavailable",
    statusLabel: site.available ? "Available" : "Unavailable",
    region: site.city,
    address: "",
    coordinates: SITE_COORDINATES[site.id] ?? [35.0, -6.0],
    size: site.size,
    illuminated: site.illuminated,
    backlit: false,
    imageUrl: REAL_PHOTOS[site.photoIndex % REAL_PHOTOS.length] ?? null,
    isAvailable: site.available,
  };
}

function getFallbackBillboards(): Billboard[] {
  return SITES.map(siteToBillboard);
}

export interface BillboardsResult {
  billboards: Billboard[];
  source: "api" | "fallback";
}

/**
 * Fetches billboards from the Django API. Intended to be called from a Server
 * Component — Next caches/revalidates the response every 5 minutes, and
 * `cache()` shares one result between every caller in the same render.
 * Falls back to the static SITES data whenever the API is unreachable,
 * unconfigured, slow to wake, or returns nothing usable — a page must never
 * render empty or throw because the backend is cold or down. `source` lets the
 * UI show a small non-blocking notice when it's on fallback data.
 */
export const getBillboardsResult = cache(async (): Promise<BillboardsResult> => {
  try {
    const json = await apiFetch<unknown>(BILLBOARDS_PATH, {
      timeoutMs: BILLBOARDS_TIMEOUT_MS,
      next: { revalidate: 300 },
    });

    const billboards = unwrapList<BillboardAPI>(json)
      .map(adaptBillboard)
      .filter((b): b is Billboard => b !== null);

    if (billboards.length === 0) {
      console.warn("[billboards] API returned no usable records, using fallback data");
      return { billboards: getFallbackBillboards(), source: "fallback" };
    }
    return { billboards, source: "api" };
  } catch (err) {
    console.warn("[billboards] fetch failed, using fallback data:", err instanceof Error ? err.message : err);
    return { billboards: getFallbackBillboards(), source: "fallback" };
  }
});

export async function getBillboards(): Promise<Billboard[]> {
  return (await getBillboardsResult()).billboards;
}

function emptyByFormat<T>(make: () => T): Record<BillboardFormat, T> {
  return { static: make(), digital: make(), light_pole: make(), airport: make(), station: make(), other: make() };
}

/** Every format key is always present, so callers can index without checking. */
export async function getBillboardsByFormat(): Promise<Record<BillboardFormat, Billboard[]>> {
  const grouped = emptyByFormat<Billboard[]>(() => []);
  for (const billboard of await getBillboards()) grouped[billboard.format].push(billboard);
  return grouped;
}

/**
 * Live site counts per format. Deliberately all zero while on fallback data:
 * the sample sites are placeholders, and counting them would publish numbers
 * that don't describe the real network.
 */
export async function getBillboardCounts(): Promise<Record<BillboardFormat, number>> {
  const counts = emptyByFormat(() => 0);
  const { billboards, source } = await getBillboardsResult();
  if (source === "fallback") return counts;
  for (const billboard of billboards) counts[billboard.format]++;
  return counts;
}
