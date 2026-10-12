import { cache } from "react";
import type { HeroSlot, SiteContent, SiteImage, SiteImageKey } from "@/types/site-content";
import { apiFetch } from "./client";
import { parseApiImage } from "./images";

const SITE_CONTENT_PATH = "/api/site-content/";

// Short on purpose. Every page waits on this (the root layout reads the share
// image from it), and the site has a complete set of built-in photos to fall
// back on, so a sleeping backend must cost a build or a revalidation seconds,
// not the 30–50s a Render cold start can take.
export const SITE_CONTENT_TIMEOUT_MS = 8_000;

export const SITE_CONTENT_REVALIDATE_SECONDS = 60;

/**
 * Converts the raw `{ "<slot key>": { url, alt, width, height } }` response
 * into a SiteContent map. A malformed or disallowed entry is dropped on its
 * own; the rest of the response still counts.
 */
export function adaptSiteContent(json: unknown): SiteContent {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return {};

  const content: SiteContent = {};
  for (const [key, raw] of Object.entries(json)) {
    const image = parseApiImage(raw, `site-content ${key}`);
    if (image) content[key] = image;
  }
  return content;
}

/**
 * Images editors have set in the Django admin, keyed by slot. Intended to be
 * called from a Server Component or generateMetadata: Next caches the response
 * for a minute, and `cache()` shares one result between every caller in the
 * same render. Never throws. An unreachable, slow or misbehaving API gives
 * `{}`, which every caller reads as "use the built-in photo".
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    const json = await apiFetch<unknown>(SITE_CONTENT_PATH, {
      timeoutMs: SITE_CONTENT_TIMEOUT_MS,
      next: { revalidate: SITE_CONTENT_REVALIDATE_SECONDS },
    });
    return adaptSiteContent(json);
  } catch (err) {
    console.warn("[site-content] fetch failed, using built-in images:", err instanceof Error ? err.message : err);
    return {};
  }
});

/** The image for one slot, or null when the slot is empty and the caller should use its fallback. */
export function slotImage(content: SiteContent, key: SiteImageKey): SiteImage | null {
  return content[key] ?? null;
}

/** The three hero slides' images, ready to hand to HomeClient as a prop. */
export function heroImages(content: SiteContent): Record<HeroSlot, SiteImage | null> {
  return {
    ooh: slotImage(content, "home.hero.ooh"),
    digital: slotImage(content, "home.hero.digital"),
    airport: slotImage(content, "home.hero.airport"),
  };
}
