import { describe, it, expect } from "vitest";
import {
  alignLeft,
  alignRight,
  alignCenterHorizontal,
  alignTop,
  alignBottom,
  alignMiddleVertical,
  distributeHorizontally,
  distributeVertically,
  nudge,
  type LayerBounds,
} from "@/lib/canvas/alignment";

const layers: LayerBounds = {
  a: { x: 0, y: 0, width: 100, height: 50 },
  b: { x: 200, y: 100, width: 50, height: 50 },
  c: { x: 500, y: 40, width: 20, height: 200 },
};

describe("horizontal alignment", () => {
  it("alignLeft moves every layer to the leftmost x, keeps the layer already there untouched", () => {
    expect(alignLeft(layers)).toEqual({ b: { x: 0 }, c: { x: 0 } });
  });

  it("alignRight moves every right edge to the rightmost right edge", () => {
    // bounding box right edge = 520 (c: 500 + 20)
    expect(alignRight(layers)).toEqual({ a: { x: 420 }, b: { x: 470 } });
  });

  it("alignCenterHorizontal centers every layer on the bounding box's horizontal midpoint", () => {
    // bounding box: x 0..520, midpoint 260
    expect(alignCenterHorizontal(layers)).toEqual({
      a: { x: 210 },
      b: { x: 235 },
      c: { x: 250 },
    });
  });
});

describe("vertical alignment", () => {
  it("alignTop moves every layer to the topmost y", () => {
    expect(alignTop(layers)).toEqual({ b: { y: 0 }, c: { y: 0 } });
  });

  it("alignBottom moves every bottom edge to the lowest bottom edge", () => {
    // bounding box bottom = 240 (c: 40 + 200)
    expect(alignBottom(layers)).toEqual({ a: { y: 190 }, b: { y: 190 } });
  });

  it("alignMiddleVertical centers every layer on the bounding box's vertical midpoint", () => {
    // bounding box: y 0..240, midpoint 120
    expect(alignMiddleVertical(layers)).toEqual({
      a: { y: 95 },
      b: { y: 95 },
      c: { y: 20 },
    });
  });
});

describe("alignment is a no-op for a single layer", () => {
  const one: LayerBounds = { a: { x: 10, y: 10, width: 30, height: 30 } };

  it("returns no patches from any alignment function", () => {
    for (const fn of [
      alignLeft,
      alignRight,
      alignCenterHorizontal,
      alignTop,
      alignBottom,
      alignMiddleVertical,
    ]) {
      expect(fn(one)).toEqual({});
    }
  });
});

describe("distributeHorizontally", () => {
  it("does nothing with fewer than 3 layers", () => {
    const two: LayerBounds = {
      a: { x: 0, y: 0, width: 10, height: 10 },
      b: { x: 100, y: 0, width: 10, height: 10 },
    };
    expect(distributeHorizontally(two)).toEqual({});
  });

  it("equalizes the horizontal gaps and leaves the first/last layer's x unchanged", () => {
    const items: LayerBounds = {
      a: { x: 0, y: 0, width: 10, height: 10 }, // right edge 10
      b: { x: 40, y: 0, width: 10, height: 10 }, // out of order on purpose
      c: { x: 100, y: 0, width: 10, height: 10 }, // right edge 110
    };
    // span = 110 - 0 = 110, total width = 30, gap = (110-30)/2 = 40
    const patch = distributeHorizontally(items);
    expect(patch.a).toBeUndefined();
    expect(patch.b).toEqual({ x: 50 });
    expect(patch.c).toBeUndefined(); // c is already at its correct x=100
  });

  it("keeps equal gaps regardless of input order", () => {
    const items: LayerBounds = {
      c: { x: 300, y: 0, width: 10, height: 10 },
      a: { x: 0, y: 0, width: 10, height: 10 },
      b: { x: 150, y: 0, width: 10, height: 10 },
    };
    const patch = distributeHorizontally(items);
    // gap = (310 - 30) / 2 = 140 -> b.x should be 10 + 140 = 150 (already there, no patch)
    expect(patch.b).toBeUndefined();
  });
});

describe("distributeVertically", () => {
  it("equalizes vertical gaps", () => {
    const items: LayerBounds = {
      a: { x: 0, y: 0, width: 10, height: 10 },
      b: { x: 0, y: 30, width: 10, height: 10 },
      c: { x: 0, y: 100, width: 10, height: 10 },
    };
    // span = 110, total height = 30, gap = 40
    const patch = distributeVertically(items);
    expect(patch.b).toEqual({ y: 50 });
    expect(patch.a).toBeUndefined();
    expect(patch.c).toBeUndefined();
  });
});

describe("nudge", () => {
  it("moves every layer by the same delta", () => {
    const layers: LayerBounds = {
      a: { x: 0, y: 0, width: 10, height: 10 },
      b: { x: 50, y: 20, width: 5, height: 5 },
    };
    expect(nudge(layers, 5, -3)).toEqual({
      a: { x: 5, y: -3 },
      b: { x: 55, y: 17 },
    });
  });

  it("returns a zero-delta patch (still a valid, applyable patch) for dx=dy=0", () => {
    const layers: LayerBounds = { a: { x: 1, y: 2, width: 10, height: 10 } };
    expect(nudge(layers, 0, 0)).toEqual({ a: { x: 1, y: 2 } });
  });

  it("is a no-op object for an empty selection", () => {
    expect(nudge({}, 5, 5)).toEqual({});
  });
});
