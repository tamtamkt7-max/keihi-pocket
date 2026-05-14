import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://keihi-pocket.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
