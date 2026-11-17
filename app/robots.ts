import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Only the landing page is public content. Everything behind a login (or carrying a
// one-time token in the URL) is kept out of crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/board/",
        "/board-link/",
        "/invite/",
        "/invalid-link",
        "/api/",
        "/login",
        "/register",
        "/reset",
        "/new-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
