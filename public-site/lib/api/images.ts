import { isAllowedMediaUrl, mediaUrlHostname } from "@/lib/media-hosts";
import type { SiteImage } from "@/types/site-content";

const warned = new Set<string>();

function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

function toDimension(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : null;
}

/**
 * Reads one `{url, alt, width, height}` object from the API. Returns null for
 * anything unusable, so the caller falls back to its built-in photo.
 *
 * The URL has to pass lib/media-hosts.ts: next/image refuses a host that
 * isn't in next.config.ts, and that would break the page rather than the one
 * picture. `label` names the image in the warning, e.g. "site-content home.hero.ooh".
 */
export function parseApiImage(raw: unknown, label: string): SiteImage | null {
  if (typeof raw !== "object" || raw === null) {
    warnOnce(`[${label}] ignoring image: expected an object with a url`);
    return null;
  }
  const { url, alt, width, height } = raw as Record<string, unknown>;

  if (!isAllowedMediaUrl(url)) {
    const hostname = mediaUrlHostname(url);
    warnOnce(
      hostname
        ? `[${label}] ignoring image on "${hostname}": not an https address on a host and path listed in lib/media-hosts.ts`
        : `[${label}] ignoring image: its url is missing or not an http(s) address`,
    );
    return null;
  }

  return {
    url,
    alt: typeof alt === "string" ? alt.trim() : "",
    width: toDimension(width),
    height: toDimension(height),
  };
}
