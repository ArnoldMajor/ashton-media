import type { NextConfig } from "next";
import { MEDIA_HOSTS } from "./lib/media-hosts.ts";

const nextConfig: NextConfig = {
  images: {
    // 90 is PHOTO_QUALITY in lib/photos.ts, used for every photograph; 75 is
    // the default the brand logos keep.
    qualities: [75, 90],
    // The hosts live in lib/media-hosts.ts so the API helpers can check an
    // image URL against the same list. When R2 moves to a custom domain, add
    // that hostname there.
    remotePatterns: MEDIA_HOSTS.map(({ hostname, pathname }) => ({
      protocol: "https" as const,
      hostname,
      pathname,
    })),
  },
};

export default nextConfig;
