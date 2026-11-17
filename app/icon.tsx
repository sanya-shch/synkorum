import { ImageResponse } from "next/og";

import { BRAND_COLOR } from "@/lib/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_COLOR,
        color: "white",
        fontSize: 22,
        fontWeight: 700,
        borderRadius: 8,
      }}
    >
      S
    </div>,
    size,
  );
}
