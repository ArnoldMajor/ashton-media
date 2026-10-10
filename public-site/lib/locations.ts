import type { Billboard } from "@/types/billboard";
import type { Location, LocationCluster, SiteFormat } from "@/types/location";

/**
 * The map draws three marker shapes, keyed by `SiteFormat`. Every backend
 * format lands in one of them; "traditional" is the square, used for static
 * sites and for anything without a shape of its own.
 */
const MARKER_FORMAT: Partial<Record<Billboard["format"], SiteFormat>> = {
  digital: "digital",
  airport: "airport",
};

/** The one place a Billboard becomes a map Location. */
export function billboardToLocation(billboard: Billboard): Location {
  return {
    id: billboard.id,
    name: billboard.name,
    city: billboard.region,
    format: MARKER_FORMAT[billboard.format] ?? "traditional",
    coordinates: billboard.coordinates,
    available: billboard.isAvailable,
    size: billboard.size ?? undefined,
  };
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
