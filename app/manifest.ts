import type { MetadataRoute } from "next";

import { BRAND_COLOR, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - real-time collaborative whiteboard`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: BRAND_COLOR,
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
