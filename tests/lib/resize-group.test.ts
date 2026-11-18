import { describe, it, expect } from "vitest";
import { resizeGroup } from "@/lib/canvas/resize-group";
import type { LayerBounds } from "@/lib/canvas/alignment";

describe("resizeGroup - single layer (reduces to a direct resize)", () => {
  it("resizes the one layer to exactly the new group bounds", () => {
    const initialGroup = { x: 0, y: 0, width: 100, height: 100 };
    const layers: LayerBounds = { a: { x: 0, y: 0, width: 100, height: 100 } };
    const newGroup = { x: 0, y: 0, width: 200, height: 50 };

    expect(resizeGroup(initialGroup, layers, newGroup)).toEqual({
      a: { x: 0, y: 0, width: 200, height: 50 },
    });
  });
});

describe("resizeGroup - multiple layers", () => {
  const initialGroup = { x: 0, y: 0, width: 100, height: 100 };
  // b is offset 50px right and is half the group's size
  const layers: LayerBounds = {
    a: { x: 0, y: 0, width: 50, height: 50 },
    b: { x: 50, y: 50, width: 50, height: 50 },
  };

  it("scales every layer's size and keeps its position proportional to the group", () => {
    // Doubling the group in both axes should double every layer's size and offset.
    const newGroup = { x: 0, y: 0, width: 200, height: 200 };

    expect(resizeGroup(initialGroup, layers, newGroup)).toEqual({
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 100, width: 100, height: 100 },
    });
  });

  it("scales x and y independently when the group resizes non-uniformly", () => {
    const newGroup = { x: 0, y: 0, width: 400, height: 50 }; // 4x width, half height

    const result = resizeGroup(initialGroup, layers, newGroup);
    expect(result.a).toEqual({ x: 0, y: 0, width: 200, height: 25 });
    expect(result.b).toEqual({ x: 200, y: 25, width: 200, height: 25 });
  });

  it("shrinking to a point (width/height 0) collapses every layer to that point", () => {
    const newGroup = { x: 10, y: 10, width: 0, height: 0 };

    const result = resizeGroup(initialGroup, layers, newGroup);
    expect(result.a).toEqual({ x: 10, y: 10, width: 0, height: 0 });
    expect(result.b).toEqual({ x: 10, y: 10, width: 0, height: 0 });
  });

  it("accounts for the group having moved (not just resized)", () => {
    // Group moved from (0,0) to (100,100) and doubled in size.
    const newGroup = { x: 100, y: 100, width: 200, height: 200 };

    const result = resizeGroup(initialGroup, layers, newGroup);
    expect(result.a).toEqual({ x: 100, y: 100, width: 100, height: 100 });
    expect(result.b).toEqual({ x: 200, y: 200, width: 100, height: 100 });
  });

  it("a no-op resize (new bounds equal the initial bounds) returns the original layer bounds", () => {
    expect(resizeGroup(initialGroup, layers, initialGroup)).toEqual(layers);
  });
});

describe("resizeGroup - degenerate initial group (zero width/height)", () => {
  it("does not divide by zero; falls back to a scale of 1 on that axis", () => {
    const initialGroup = { x: 5, y: 5, width: 0, height: 0 };
    const layers: LayerBounds = { a: { x: 5, y: 5, width: 0, height: 0 } };
    const newGroup = { x: 5, y: 5, width: 40, height: 40 };

    const result = resizeGroup(initialGroup, layers, newGroup);
    expect(Number.isFinite(result.a.width)).toBe(true);
    expect(Number.isFinite(result.a.height)).toBe(true);
  });
});
