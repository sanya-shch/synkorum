import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({ isProd: process.env.NODE_ENV === "production" }),
      },
    ];
  },
};

export default nextConfig;
