// Single source of truth for everything that describes the public site (metadata, robots,
// sitemap, social cards, structured data).
export const SITE_NAME = "Synkorum";
export const SITE_TAGLINE = "Real-time collaborative whiteboard";
export const SITE_TITLE = `${SITE_NAME} - ${SITE_TAGLINE.toLowerCase()}`;
export const SITE_DESCRIPTION =
  "Brainstorm, sketch, diagram and collaborate in real time on one infinite canvas, in one shared workspace.";

// Set NEXT_PUBLIC_APP_URL to the production origin; localhost is only the dev fallback.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const BRAND_COLOR = "#5548e8";
