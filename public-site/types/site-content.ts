/** An image an editor set in the Django admin, already checked against lib/media-hosts.ts. */
export interface SiteImage {
  url: string;
  /** "" when the editor left it blank. */
  alt: string;
  width: number | null;
  height: number | null;
}

/**
 * Slot keys, mirroring backend/sitecontent/registry.py. The API is the source
 * of truth: a key it sends that isn't listed here is simply never asked for.
 */
export type SiteImageKey =
  | "home.hero.ooh"
  | "home.hero.digital"
  | "home.hero.airport"
  | "networks.static"
  | "networks.digital"
  | "networks.airport"
  | "networks.station"
  | "traditional.banner"
  | "digital.banner"
  | "airport.banner"
  | "site.share";

/** Only slots that currently have a usable image are present. */
export type SiteContent = Record<string, SiteImage>;

/** The three hero slides, by the name HomeClient gives each one. */
export type HeroSlot = "ooh" | "digital" | "airport";
