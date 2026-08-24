// ── Types ────────────────────────────────────────────────────────────────────
// TypeScript interfaces define the "shape" of our data.
// Any component that uses Site data will get autocomplete + type errors.
export type SiteType = "digital" | "traditional" | "airport";

export interface Site {
  id: number;
  name: string;
  city: string;
  type: SiteType;
  size: string;
  traffic: string;
  illuminated: boolean;
  faces: string;
  rate: string;
  available: boolean;
  bookedUntil: string | null;
  coords: { x: number; y: number };
  photoIndex: number;
}

// ── Real photos from CDN ──────────────────────────────────────────────────────
export const REAL_PHOTOS: string[] = [
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-2-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-3-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-4-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-5-2x.png",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/slp-1144-copy.jpg",
  "https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/slp-1219-copy.jpg",
];

// ── Site inventory ─────────────────────────────────────────────────────────────
export const SITES: Site[] = [
  { id: 1,  name: "New Bagamoyo Rd — Screen 01",  city: "Dar es Salaam", type: "digital",     size: "10×5m",        traffic: "85,000/day",  illuminated: true,  faces: "1", rate: "USD 2,400", available: true,  bookedUntil: null,             coords: { x: 232, y: 192 }, photoIndex: 0 },
  { id: 2,  name: "Msasani Peninsula",             city: "Dar es Salaam", type: "digital",     size: "8×4m",         traffic: "52,000/day",  illuminated: true,  faces: "1", rate: "USD 1,800", available: false, bookedUntil: "Until Aug 2025", coords: { x: 246, y: 202 }, photoIndex: 1 },
  { id: 3,  name: "Morogoro Rd Gantry",            city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "120,000/day", illuminated: true,  faces: "2", rate: "USD 1,600", available: true,  bookedUntil: null,             coords: { x: 216, y: 216 }, photoIndex: 4 },
  { id: 4,  name: "JNIA T3 — Escalator Screen",    city: "Dar es Salaam", type: "airport",     size: "Large Format", traffic: "8,000/day",   illuminated: true,  faces: "1", rate: "USD 3,200", available: true,  bookedUntil: null,             coords: { x: 240, y: 206 }, photoIndex: 3 },
  { id: 5,  name: "Ali Hassan Mwinyi Rd",          city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "95,000/day",  illuminated: true,  faces: "1", rate: "USD 1,400", available: false, bookedUntil: "Until Jun 2025", coords: { x: 226, y: 196 }, photoIndex: 5 },
  { id: 6,  name: "Arusha Town Centre",            city: "Arusha",        type: "digital",     size: "8×4m",         traffic: "40,000/day",  illuminated: true,  faces: "1", rate: "USD 1,200", available: true,  bookedUntil: null,             coords: { x: 156, y: 130 }, photoIndex: 2 },
  { id: 7,  name: "Mwanza Lakefront",              city: "Mwanza",        type: "traditional", size: "12×4m",        traffic: "35,000/day",  illuminated: false, faces: "1", rate: "USD 800",   available: true,  bookedUntil: null,             coords: { x: 119, y: 199 }, photoIndex: 4 },
  { id: 8,  name: "JNIA T3 — Baggage Reclaim",     city: "Dar es Salaam", type: "airport",     size: "Digital Screen",traffic: "8,000/day",  illuminated: true,  faces: "2", rate: "USD 2,800", available: false, bookedUntil: "Until Jul 2025", coords: { x: 239, y: 209 }, photoIndex: 3 },
  { id: 9,  name: "Changombe Rd",                  city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "78,000/day",  illuminated: true,  faces: "1", rate: "USD 1,200", available: true,  bookedUntil: null,             coords: { x: 229, y: 219 }, photoIndex: 5 },
  { id: 10, name: "Kariakoo CBD",                  city: "Dar es Salaam", type: "traditional", size: "12×4m",        traffic: "110,000/day", illuminated: false, faces: "2", rate: "USD 1,000", available: true,  bookedUntil: null,             coords: { x: 221, y: 211 }, photoIndex: 4 },
  { id: 11, name: "Mlimani City Mall",             city: "Dar es Salaam", type: "digital",     size: "6×3m",         traffic: "30,000/day",  illuminated: true,  faces: "1", rate: "USD 1,600", available: false, bookedUntil: "Until Sep 2025", coords: { x: 211, y: 206 }, photoIndex: 1 },
  { id: 12, name: "Dodoma — Main Rd",              city: "Dodoma",        type: "traditional", size: "12×4m",        traffic: "28,000/day",  illuminated: false, faces: "1", rate: "USD 600",   available: true,  bookedUntil: null,             coords: { x: 201, y: 253 }, photoIndex: 5 },
];

// ── Format badge config ────────────────────────────────────────────────────────
export const FORMAT_CONFIG = {
  digital:     { label: "Digital",     color: "var(--lime)",              bg: "var(--lime-glow-soft)",   border: "var(--lime-border)" },
  traditional: { label: "Traditional", color: "var(--white-strong)", bg: "var(--border)", border: "var(--white-light)" },
  airport:     { label: "Airport",     color: "var(--white-medium)", bg: "var(--white-faintest)", border: "var(--white-soft)" },
} as const;
