import { ImageResponse } from "next/og";

import { BRAND_COLOR, SITE_NAME } from "@/lib/site";

export const alt = "Synkorum - real-time collaborative whiteboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card shown when the link is shared (Slack, Telegram, LinkedIn, X, ...).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf9f7",
          color: "#1e1f3a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              background: BRAND_COLOR,
              color: "white",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ marginLeft: 20, fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Great ideas don&apos;t happen in isolation.
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#585970" }}>
            Real-time collaborative whiteboards for your team.
          </div>
        </div>

        <div style={{ display: "flex", height: 12, width: 220, borderRadius: 6, background: BRAND_COLOR }} />
      </div>
    ),
    size,
  );
}
