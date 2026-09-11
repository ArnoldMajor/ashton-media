import { SITES } from "@/lib/data";
import type { Location, LocationCluster, SiteFormat } from "@/types/location";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Tanzania's approximate bounding box — used to sanity-check incoming coordinates.
const LNG_RANGE: [number, number] = [29.3, 40.5];
const LAT_RANGE: [number, number] = [-11.8, -0.9];

/**
 * Real coordinates for the static SITES fallback, keyed by site id. lib/data.ts
 * carries no positional data of its own (that's a map-specific concern), so this
 * is the one place a Site becomes a Location.
 */
const FALLBACK_COORDINATES: Record<number, [number, number]> = {
  1: [39.243, -6.759], // New Bagamoyo Rd — Screen 01
  2: [39.279, -6.745], // Msasani Peninsula
  3: [39.228, -6.818], // Morogoro Rd Gantry
  4: [39.202, -6.878], // JNIA T3 — Escalator Screen
  5: [39.267, -6.776], // Ali Hassan Mwinyi Rd
  6: [36.683, -3.367], // Arusha Town Centre
  7: [32.9, -2.517], // Mwanza Lakefront
  8: [39.205, -6.881], // JNIA T3 — Baggage Reclaim
  9: [39.257, -6.85], // Changombe Rd
  10: [39.269, -6.818], // Kariakoo CBD
  11: [39.208, -6.774], // Mlimani City Mall
  12: [35.742, -6.163], // Dodoma — Main Rd
};

function siteToLocation(site: (typeof SITES)[number]): Location {
  return {
    id: site.id,
    name: site.name,
    city: site.city,
    format: site.type,
    coordinates: FALLBACK_COORDINATES[site.id] ?? [35.0, -6.0],
    available: site.available,
    size: site.size,
    traffic: site.traffic,
    rate: site.rate,
  };
}

function getFallbackLocations(): Location[] {
  return SITES.map(siteToLocation);
}

function isValidCoordinates(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lng, lat] = value;
  return typeof lng === "number" && typeof lat === "number" && Number.isFinite(lng) && Number.isFinite(lat);
}

function isInTanzaniaBounds([lng, lat]: [number, number]): boolean {
  return lng >= LNG_RANGE[0] && lng <= LNG_RANGE[1] && lat >= LAT_RANGE[0] && lat <= LAT_RANGE[1];
}

const VALID_FORMATS: SiteFormat[] = ["digital", "traditional", "airport"];

/**
 * Coerces and validates one raw API record into a Location. Returns null (and
 * logs a warning) for anything malformed or geographically implausible, so a
 * bad record from the backend can't crash or mis-render the map.
 */
function normalizeLocation(raw: unknown): Location | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const coordinates = [Number(Array.isArray(r.coordinates) ? r.coordinates[0] : NaN), Number(Array.isArray(r.coordinates) ? r.coordinates[1] : NaN)] as [number, number];

  if (!isValidCoordinates(coordinates)) {
    console.warn(`[locations] dropping "${String(r.name ?? r.id)}" — missing/invalid coordinates`);
    return null;
  }
  if (!isInTanzaniaBounds(coordinates)) {
    console.warn(`[locations] dropping "${String(r.name ?? r.id)}" — coordinates ${JSON.stringify(coordinates)} fall outside Tanzania bounds`);
    return null;
  }
  if (typeof r.format !== "string" || !VALID_FORMATS.includes(r.format as SiteFormat)) {
    console.warn(`[locations] dropping "${String(r.name ?? r.id)}" — invalid format "${String(r.format)}"`);
    return null;
  }
  if (typeof r.id !== "number" || typeof r.name !== "string" || typeof r.city !== "string") {
    console.warn(`[locations] dropping a record — missing id/name/city`);
    return null;
  }

  return {
    id: r.id,
    name: r.name,
    city: r.city,
    format: r.format as SiteFormat,
    coordinates,
    available: Boolean(r.available),
    size: typeof r.size === "string" ? r.size : undefined,
    traffic: typeof r.traffic === "string" ? r.traffic : undefined,
    rate: typeof r.rate === "string" ? r.rate : undefined,
  };
}

export interface LocationsResult {
  locations: Location[];
  source: "api" | "fallback";
}

/**
 * Fetches published locations from the Django API. Intended to be called from
 * a Server Component — Next caches/revalidates the response every 5 minutes.
 * Falls back to the static SITES data (with real coordinates) whenever the
 * API is unreachable, unconfigured, or returns something unusable — the map
 * must never render empty or throw because the backend is down. `source`
 * lets the UI show a small non-blocking notice when it's on fallback data.
 */
export async function getLocationsResult(): Promise<LocationsResult> {
  if (!API_BASE) {
    return { locations: getFallbackLocations(), source: "fallback" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/locations/`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.warn(`[locations] API responded ${res.status}, using fallback data`);
      return { locations: getFallbackLocations(), source: "fallback" };
    }

    const body = await res.json();
    const rawList: unknown[] = Array.isArray(body) ? body : Array.isArray(body?.results) ? body.results : [];

    if (rawList.length === 0) {
      console.warn("[locations] API returned no usable records, using fallback data");
      return { locations: getFallbackLocations(), source: "fallback" };
    }

    const normalized = rawList.map(normalizeLocation).filter((l): l is Location => l !== null);
    return normalized.length > 0
      ? { locations: normalized, source: "api" }
      : { locations: getFallbackLocations(), source: "fallback" };
  } catch (err) {
    console.warn("[locations] fetch failed, using fallback data:", err);
    return { locations: getFallbackLocations(), source: "fallback" };
  }
}

/** Convenience wrapper for callers that only need the location list. */
export async function getLocations(): Promise<Location[]> {
  return (await getLocationsResult()).locations;
}

/** Groups locations by city and computes each group's centroid. */
export function clusterByCity(locations: Location[]): LocationCluster[] {
  const byCity = new Map<string, Location[]>();
  for (const loc of locations) {
    const group = byCity.get(loc.city);
    if (group) group.push(loc);
    else byCity.set(loc.city, [loc]);
  }

  return Array.from(byCity.entries()).map(([city, group]) => {
    const lng = group.reduce((sum, l) => sum + l.coordinates[0], 0) / group.length;
    const lat = group.reduce((sum, l) => sum + l.coordinates[1], 0) / group.length;

    const byFormat: Record<SiteFormat, number> = { digital: 0, traditional: 0, airport: 0 };
    for (const loc of group) byFormat[loc.format]++;

    return {
      city,
      coordinates: [lng, lat],
      count: group.length,
      byFormat,
      locations: group,
    };
  });
}
