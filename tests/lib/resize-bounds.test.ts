import { describe, it, expect } from "vitest";
import { resizeBounds } from "@/lib/canvas/layers";
import { Side } from "@/types/canvas";

const square = { x: 100, y: 100, width: 100, height: 100 }; // corners: (100,100)-(200,200)

describe("resizeBounds - unlocked (existing behavior)", () => {
  it("resizes freely from the bottom-right corner, top-left corner stays put", () => {
    const result = resizeBounds(square, Side.Bottom + Side.Right, { x: 260, y: 140 });
    expect(result).toEqual({ x: 100, y: 100, width: 160, height: 40 });
  });

  it("resizes a single edge (Right) without touching y/height", () => {
    const result = resizeBounds(square, Side.Right, { x: 300, y: 999 });
    expect(result).toEqual({ x: 100, y: 100, width: 200, height: 100 });
  });

  it("flips x when dragging past the opposite edge", () => {
    const result = resizeBounds(square, Side.Right, { x: 50, y: 140 });
    expect(result.x).toBe(50);
    expect(result.width).toBe(50);
  });
});

describe("resizeBounds - lockAspect on corner handles", () => {
  it("keeps a 1:1 shape square, anchored on the opposite (top-left) corner", () => {
    // Drag the bottom-right handle unevenly: dx=160, dy=40 -> the larger relative
    // delta (width) wins, height is scaled to match.
    const result = resizeBounds(square, Side.Bottom + Side.Right, { x: 260, y: 140 }, true);
    expect(result).toEqual({ x: 100, y: 100, width: 160, height: 160 });
  });

  it("anchors the opposite corner correctly when dragging the top-left handle", () => {
    // Original bottom-right corner (200,200) must stay fixed.
    const result = resizeBounds(square, Side.Top + Side.Left, { x: 140, y: 190 }, true);
    // dx from right edge = 60, dy from bottom edge = 10 -> width delta dominates
    expect(result.width).toBe(60);
    expect(result.height).toBe(60);
    expect(result.x + result.width).toBe(200); // right edge unchanged
    expect(result.y + result.height).toBe(200); // bottom edge unchanged
  });

  it("preserves a non-square aspect ratio (2:1 rectangle), not just 1:1", () => {
    const wide = { x: 0, y: 0, width: 200, height: 100 };
    const result = resizeBounds(wide, Side.Bottom + Side.Right, { x: 300, y: 130 }, true);
    // width delta relative = 300/200=1.5, height delta relative = 130/100=1.3 -> width wins
    expect(result.width).toBe(300);
    expect(result.height).toBe(150); // keeps the original 2:1 ratio
  });

  it("is a no-op difference from unlocked when the drag is already proportional", () => {
    const locked = resizeBounds(square, Side.Bottom + Side.Right, { x: 200, y: 200 }, true);
    const unlocked = resizeBounds(square, Side.Bottom + Side.Right, { x: 200, y: 200 }, false);
    expect(locked).toEqual(unlocked);
  });

  it("does not lock a single-edge handle (no second axis to derive a ratio from)", () => {
    const locked = resizeBounds(square, Side.Right, { x: 300, y: 999 }, true);
    expect(locked).toEqual({ x: 100, y: 100, width: 200, height: 100 });
  });

  it("defaults to unlocked when the flag is omitted", () => {
    const result = resizeBounds(square, Side.Bottom + Side.Right, { x: 260, y: 140 });
    expect(result).toEqual({ x: 100, y: 100, width: 160, height: 40 });
  });
});
