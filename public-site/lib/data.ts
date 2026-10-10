/**
 * Static sample sites. FALLBACK ONLY — the live site reads billboards from the
 * Django API via lib/api/billboards.ts, which maps these to `Billboard` when
 * the API is unreachable. Don't import this from pages or components.
 */
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
  photoIndex: number;
}

export const SITES: Site[] = [
  { id: 1,  name: "New Bagamoyo Rd — Screen 01",  city: "Dar es Salaam", type: "digital",     size: "10×5m",        traffic: "85,000/day",  illuminated: true,  faces: "1", rate: "USD 2,400", available: true,  bookedUntil: null, photoIndex: 0 },
  { id: 2,  name: "Msasani Peninsula",             city: "Dar es Salaam", type: "digital",     size: "8×4m",         traffic: "52,000/day",  illuminated: true,  faces: "1", rate: "USD 1,800", available: false, bookedUntil: "Until Aug 2025", photoIndex: 1 },
  { id: 3,  name: "Morogoro Rd Gantry",            city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "120,000/day", illuminated: true,  faces: "2", rate: "USD 1,600", available: true,  bookedUntil: null, photoIndex: 4 },
  { id: 4,  name: "JNIA T3 — Escalator Screen",    city: "Dar es Salaam", type: "airport",     size: "Large Format", traffic: "8,000/day",   illuminated: true,  faces: "1", rate: "USD 3,200", available: true,  bookedUntil: null, photoIndex: 3 },
  { id: 5,  name: "Ali Hassan Mwinyi Rd",          city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "95,000/day",  illuminated: true,  faces: "1", rate: "USD 1,400", available: false, bookedUntil: "Until Jun 2025", photoIndex: 5 },
  { id: 6,  name: "Arusha Town Centre",            city: "Arusha",        type: "digital",     size: "8×4m",         traffic: "40,000/day",  illuminated: true,  faces: "1", rate: "USD 1,200", available: true,  bookedUntil: null, photoIndex: 2 },
  { id: 7,  name: "Mwanza Lakefront",              city: "Mwanza",        type: "traditional", size: "12×4m",        traffic: "35,000/day",  illuminated: false, faces: "1", rate: "USD 800",   available: true,  bookedUntil: null, photoIndex: 4 },
  { id: 8,  name: "JNIA T3 — Baggage Reclaim",     city: "Dar es Salaam", type: "airport",     size: "Digital Screen",traffic: "8,000/day",  illuminated: true,  faces: "2", rate: "USD 2,800", available: false, bookedUntil: "Until Jul 2025", photoIndex: 3 },
  { id: 9,  name: "Changombe Rd",                  city: "Dar es Salaam", type: "traditional", size: "18×6m",        traffic: "78,000/day",  illuminated: true,  faces: "1", rate: "USD 1,200", available: true,  bookedUntil: null, photoIndex: 5 },
  { id: 10, name: "Kariakoo CBD",                  city: "Dar es Salaam", type: "traditional", size: "12×4m",        traffic: "110,000/day", illuminated: false, faces: "2", rate: "USD 1,000", available: true,  bookedUntil: null, photoIndex: 4 },
  { id: 11, name: "Mlimani City Mall",             city: "Dar es Salaam", type: "digital",     size: "6×3m",         traffic: "30,000/day",  illuminated: true,  faces: "1", rate: "USD 1,600", available: false, bookedUntil: "Until Sep 2025", photoIndex: 1 },
  { id: 12, name: "Dodoma — Main Rd",              city: "Dodoma",        type: "traditional", size: "12×4m",        traffic: "28,000/day",  illuminated: false, faces: "1", rate: "USD 600",   available: true,  bookedUntil: null, photoIndex: 5 },
];

/** [longitude, latitude] for each sample site, keyed by site id. */
export const SITE_COORDINATES: Record<number, [number, number]> = {
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
