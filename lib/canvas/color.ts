import type { Color } from "@/types/canvas";

const COLORS = [
  "#e78d92",
  "#6b4c8f",
  "#4b8c5a",
  "#ff3333",
  "#f57f20",
  "#2b6c93",
  "#6e99c2",
  "#b2dfdb",
  "#f7e4b8",
  "#8d2e3b",
  "#a8e8d0",
  "#4caf50",
  "#f9c9c9",
  "#f27b9a",
];

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

export function colorToCss(color: Color) {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}

export function getContrastingTextColor(color: Color) {
  const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;

  return luminance > 182 ? "black" : "white";
}
