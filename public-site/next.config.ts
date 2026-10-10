import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from the Ashton Media CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.ashtonmedia.net",
        pathname: "/uploads/**",
      },
      // Billboard photos uploaded through the Django admin (Cloudflare R2)
      {
        protocol: "https",
        hostname: "pub-4433221b2f654cf6b16f9b48c9d34e6c.r2.dev",
        pathname: "/billboards/**",
      },
    ],
  },
};

export default nextConfig;
