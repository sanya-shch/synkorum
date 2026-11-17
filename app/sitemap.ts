import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Just the landing page: every other route is private and marked noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
