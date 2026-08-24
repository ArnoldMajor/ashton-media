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
    ],
  },
};

export default nextConfig;
