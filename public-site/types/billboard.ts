/**
 * Format keys, mirroring `Billboard.Format` in backend/billboards/models.py.
 * The API is the source of truth — keep this list in step with that enum.
 */
export const KNOWN_BILLBOARD_FORMATS = ["static", "digital", "light_pole", "airport", "station"] as const;

export type KnownBillboardFormat = (typeof KNOWN_BILLBOARD_FORMATS)[number];

/**
 * "other" is the fallback bucket for a format the backend added after this
 * list was written. Such a record still renders, labelled with whatever
 * `format_display` the API sent, rather than being dropped or crashing.
 */
export type BillboardFormat = KnownBillboardFormat | "other";

/** Status keys, mirroring `Billboard.Status` (spelling included) in the Django model. */
export type BillboardStatus = "available" | "under_maintanance" | "unavailable" | "other";

/** Exactly what the API sends. */
export interface BillboardAPI {
  id: number;
  site_code: string;
  name: string;
  format: string;
  format_display: string;
  status: string;
  status_display: string;
  region: string;
  address: string;
  /** Strings, not numbers — DRF serialises DecimalField as a string. */
  latitude: string;
  longitude: string;
  width_meters: string | null;
  height_meters: string | null;
  illuminated: boolean;
  backlit: boolean;
  structure_code: string;
  side: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

/** What the app actually uses. */
export interface Billboard {
  id: number;
  siteCode: string;
  name: string;
  format: BillboardFormat;
  formatLabel: string;
  status: BillboardStatus;
  statusLabel: string;
  region: string;
  address: string;
  /** [longitude, latitude] — GeoJSON order, lng FIRST, already parsed to numbers. */
  coordinates: [number, number];
  /** e.g. "10 × 5 m", or null when the backend has no dimensions. */
  size: string | null;
  illuminated: boolean;
  backlit: boolean;
  imageUrl: string | null;
  isAvailable: boolean;
}
