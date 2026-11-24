import { describe, it, expect } from "vitest";
import { findIntersectingLayersWithRectangle } from "@/lib/canvas/layers";
import { LayerType, type Layer } from "@/types/canvas";

const black = { r: 0, g: 0, b: 0 };

const layers = new Map<string, Layer>([
  ["box", { type: LayerType.Rectangle, x: 0, y: 0, width: 100, height: 100, fill: black }],
  // A long diagonal from (200,0) to (600,400): its bounding box is huge, the line is thin.
  [
    "diagonal",
    {
      type: LayerType.Line,
      x: 200,
      y: 0,
      width: 400,
      height: 400,
      flipX: false,
      flipY: false,
      fill: black,
    },
  ],
  [
    "horizontal",
    {
      type: LayerType.Line,
      x: 0,
      y: 500,
      width: 300,
      height: 0,
      flipX: false,
      flipY: false,
      fill: black,
    },
  ],
]);
const ids = ["box", "diagonal", "horizontal"];

describe("rubber-band selection", () => {
  it("selects shapes whose box the net overlaps", () => {
    expect(
      findIntersectingLayersWithRectangle(ids, layers, { x: 50, y: 50 }, { x: 80, y: 80 }),
    ).toEqual(["box"]);
  });

  it("selects a diagonal line only where the line itself crosses the net", () => {
    // Inside the diagonal's bounding box (200..600 x 0..400) but far from the line itself.
    const farFromLine = findIntersectingLayersWithRectangle(
      ids,
      layers,
      { x: 500, y: 20 },
      { x: 560, y: 60 },
    );
    expect(farFromLine).toEqual([]);

    // A net around a point actually on the line (400,200).
    const onLine = findIntersectingLayersWithRectangle(
      ids,
      layers,
      { x: 380, y: 180 },
      { x: 420, y: 220 },
    );
    expect(onLine).toEqual(["diagonal"]);
  });

  it("still selects a horizontal line (a zero-height box) that the net crosses", () => {
    expect(
      findIntersectingLayersWithRectangle(ids, layers, { x: 100, y: 480 }, { x: 140, y: 520 }),
    ).toEqual(["horizontal"]);
  });

  it("respects flipped lines", () => {
    const flipped = new Map<string, Layer>([
      [
        "up",
        {
          type: LayerType.Line,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          flipX: false,
          flipY: true,
          fill: black,
        },
      ],
    ]);

    // flipY: the line runs from (0,100) to (100,0); the top-left corner is NOT on it.
    expect(
      findIntersectingLayersWithRectangle(["up"], flipped, { x: 0, y: 0 }, { x: 20, y: 20 }),
    ).toEqual([]);
    expect(
      findIntersectingLayersWithRectangle(["up"], flipped, { x: 40, y: 40 }, { x: 60, y: 60 }),
    ).toEqual(["up"]);
  });
});
