import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The assignment names the endpoints GET /feed, POST /swipe and GET /matches.
  // They live under /api/* (Next.js convention) and are also exposed at the exact
  // paths from the brief. These rewrites only match non-browser-navigation paths
  // that have no page of their own.
  async rewrites() {
    return [
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ];
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
  devIndicators: false,
};

export default nextConfig;
