export type SiteFormat = "digital" | "traditional" | "airport";

export interface Location {
  id: number;
  name: string;
  city: string;
  format: SiteFormat;
  /** [longitude, latitude] — GeoJSON order, lng FIRST */
  coordinates: [number, number];
  available: boolean;
  size?: string;
  traffic?: string;
  rate?: string;
}

export interface LocationCluster {
  city: string;
  coordinates: [number, number]; // centroid
  count: number;
  byFormat: Record<SiteFormat, number>;
  locations: Location[];
}
