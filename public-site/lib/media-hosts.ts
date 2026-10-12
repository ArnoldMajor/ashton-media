/**
 * Where remote images may come from. One list, two readers: next.config.ts
 * turns it into `images.remotePatterns`, and the API helpers use it to reject
 * an image URL the optimiser would refuse, before it reaches next/image.
 *
 * Keep this file free of imports and of anything but plain, erasable
 * TypeScript: next.config.ts loads it directly, outside the bundler.
 *
 * When R2 moves to a custom domain, add that hostname here.
 */
export interface MediaHost {
  hostname: string;
  /** "/**" for the whole host, or "/some/folder/**" for one folder. */
  pathname: string;
}

export const MEDIA_HOSTS: MediaHost[] = [
  // The current Ashton Media site. Still the source of every fallback photo.
  { hostname: "www.ashtonmedia.net", pathname: "/uploads/**" },
  // Everything uploaded through the Django admin (Cloudflare R2):
  // billboards/, site-images/ and case-studies/.
  { hostname: "pub-4433221b2f654cf6b16f9b48c9d34e6c.r2.dev", pathname: "/**" },
];

/** True when `url` is an https URL on an allowed host, under its allowed path. */
export function isAllowedMediaUrl(url: unknown): url is string {
  return mediaUrlHostname(url) !== null && matchesMediaHost(new URL(url as string));
}

/** The hostname of a string that parses as an http(s) URL, otherwise null. */
export function mediaUrlHostname(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.hostname : null;
  } catch {
    return null;
  }
}

function matchesMediaHost(url: URL): boolean {
  // Every pattern in next.config.ts is https-only, so plain http never passes.
  if (url.protocol !== "https:") return false;
  return MEDIA_HOSTS.some((host) => {
    const prefix = host.pathname.replace(/\*\*$/, "");
    return url.hostname === host.hostname && url.pathname.startsWith(prefix);
  });
}
