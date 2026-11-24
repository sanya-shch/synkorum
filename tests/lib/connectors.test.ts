import { describe, it, expect } from "vitest";
import {
  arrowPatch,
  computeLineRoute,
  constrainAngle,
  detachFromUnmoved,
  findSnapTarget,
  getAnchorPoint,
  isConnectable,
  lineHasArrow,
  remapDuplicatedBindings,
  segmentIntersectsRect,
} from "@/lib/canvas/connectors";
import { getLineEndpoints } from "@/lib/canvas/line";
import { LayerType, type Layer, type LineLayer } from "@/types/canvas";

const black = { r: 0, g: 0, b: 0 };

const rect = (x: number, y: number, width = 100, height = 60): Layer => ({
  type: LayerType.Rectangle,
  x,
  y,
  width,
  height,
  fill: black,
});

const line = (patch: Partial<LineLayer> = {}): LineLayer => ({
  type: LayerType.Line,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  flipX: false,
  flipY: false,
  fill: black,
  ...patch,
});

const map = (entries: Record<string, Layer>) => new Map(Object.entries(entries));

describe("anchors", () => {
  const box = { x: 100, y: 200, width: 80, height: 40 };

  it("are the midpoints of the four sides", () => {
    expect(getAnchorPoint(box, "top")).toEqual({ x: 140, y: 200 });
    expect(getAnchorPoint(box, "bottom")).toEqual({ x: 140, y: 240 });
    expect(getAnchorPoint(box, "left")).toEqual({ x: 100, y: 220 });
    expect(getAnchorPoint(box, "right")).toEqual({ x: 180, y: 220 });
  });

  it("exist on every shape except lines and freehand paths", () => {
    for (const type of [
      LayerType.Rectangle,
      LayerType.Ellipse,
      LayerType.Diamond,
      LayerType.Note,
      LayerType.Text,
    ]) {
      expect(isConnectable({ type })).toBe(true);
    }
    expect(isConnectable({ type: LayerType.Line })).toBe(false);
    expect(isConnectable({ type: LayerType.Path })).toBe(false);
  });
});

describe("findSnapTarget", () => {
  const layers = map({ a: rect(0, 0), b: rect(300, 0), l: line() });
  const ids = ["a", "b", "l"];

  it("snaps a point over a shape's body to that shape's nearest side", () => {
    // Inside "a", close to its right edge.
    expect(findSnapTarget({ x: 90, y: 30 }, ids, layers, { radius: 20 })).toEqual({
      layerId: "a",
      anchor: "right",
      point: { x: 100, y: 30 },
    });
  });

  it("snaps to a magnet that is within the radius, even outside the shape", () => {
    // 10px to the left of b's left magnet (300, 30).
    expect(findSnapTarget({ x: 290, y: 30 }, ids, layers, { radius: 20 })).toMatchObject({
      layerId: "b",
      anchor: "left",
    });
  });

  it("does not snap when everything is farther away than the radius", () => {
    expect(findSnapTarget({ x: 200, y: 300 }, ids, layers, { radius: 20 })).toBeNull();
  });

  it("prefers the topmost of overlapping shapes", () => {
    const stacked = map({ under: rect(0, 0), over: rect(10, 10) });

    expect(
      findSnapTarget({ x: 50, y: 30 }, ["under", "over"], stacked, { radius: 20 }),
    ).toMatchObject({
      layerId: "over",
    });
  });

  it("can exclude shapes (e.g. the shape the other end is already attached to)", () => {
    expect(
      findSnapTarget({ x: 90, y: 30 }, ids, layers, { radius: 20, excludeIds: ["a"] }),
    ).toBeNull();
  });

  it("ignores lines and unknown ids", () => {
    const onlyLine = map({ l: line({ width: 100, height: 100 }) });
    expect(findSnapTarget({ x: 50, y: 50 }, ["l", "ghost"], onlyLine, { radius: 50 })).toBeNull();
  });
});

describe("constrainAngle", () => {
  it("snaps to the nearest 45 degrees and keeps the distance", () => {
    const result = constrainAngle({ x: 0, y: 0 }, { x: 100, y: 8 });
    expect(result.x).toBeCloseTo(Math.hypot(100, 8));
    expect(result.y).toBeCloseTo(0);

    const diagonal = constrainAngle({ x: 0, y: 0 }, { x: 60, y: 50 });
    expect(diagonal.x).toBeCloseTo(diagonal.y);
  });

  it("leaves a zero-length drag alone", () => {
    expect(constrainAngle({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
});

describe("arrowheads", () => {
  it("older lines (no `arrow` field) keep their arrowhead", () => {
    expect(lineHasArrow({})).toBe(true);
    expect(lineHasArrow({ arrow: false })).toBe(false);
  });

  it("only change when the line goes from free to attached or back", () => {
    const free = {};
    const bound = { endBinding: { layerId: "a", anchor: "left" as const } };

    expect(arrowPatch(free, bound)).toEqual({ arrow: true });
    expect(arrowPatch(bound, free)).toEqual({ arrow: false });
    expect(arrowPatch(free, free)).toEqual({});
    expect(arrowPatch(bound, bound)).toEqual({});
  });
});

describe("computeLineRoute", () => {
  const bound = line({
    x: 100,
    y: 30,
    width: 200,
    height: 0,
    arrow: true,
    startBinding: { layerId: "a", anchor: "right" },
    endBinding: { layerId: "b", anchor: "left" },
  });

  it("needs no change while the shapes sit where the line expects them", () => {
    expect(computeLineRoute(bound, map({ a: rect(0, 0), b: rect(300, 0) }))).toBeNull();
  });

  it("follows a shape that moved", () => {
    const patch = computeLineRoute(bound, map({ a: rect(0, 0), b: rect(300, 100) }))!;
    const next = { ...bound, ...patch };

    expect(getLineEndpoints(next)).toEqual({ start: { x: 100, y: 30 }, end: { x: 300, y: 130 } });
  });

  it("follows a shape that was resized (the magnet is the middle of the new side)", () => {
    const patch = computeLineRoute(bound, map({ a: rect(0, 0, 200, 100), b: rect(300, 0) }))!;

    expect(getLineEndpoints({ ...bound, ...patch }).start).toEqual({ x: 200, y: 50 });
  });

  it("keeps a free end where it is while the attached end follows", () => {
    const half = line({
      x: 100,
      y: 30,
      width: 150,
      height: 0,
      arrow: true,
      startBinding: { layerId: "a", anchor: "right" },
      endBinding: null,
    });

    const patch = computeLineRoute(half, map({ a: rect(0, 50) }))!;

    expect(getLineEndpoints({ ...half, ...patch })).toEqual({
      start: { x: 100, y: 80 },
      end: { x: 250, y: 30 },
    });
  });

  it("frees an end whose shape is gone, keeps it in place, and drops the arrow when nothing is left", () => {
    const patch = computeLineRoute(bound, map({ a: rect(0, 0) }))!;
    expect(patch).toMatchObject({ endBinding: null });
    expect(patch.arrow).toBeUndefined();

    const orphan = computeLineRoute(bound, map({}))!;
    expect(orphan).toMatchObject({ startBinding: null, endBinding: null, arrow: false });
    // Nothing about the geometry changed: the line stays where it was.
    expect(orphan.x).toBeUndefined();
    expect(orphan.width).toBeUndefined();
  });

  it("treats a binding to something that can't be attached to (e.g. another line) as gone", () => {
    const patch = computeLineRoute(bound, map({ a: rect(0, 0), b: line() }))!;
    expect(patch).toMatchObject({ endBinding: null });
  });
});

describe("detachFromUnmoved", () => {
  const bound = line({
    arrow: true,
    startBinding: { layerId: "a", anchor: "right" },
    endBinding: { layerId: "b", anchor: "left" },
  });

  it("keeps ends whose shape moved too", () => {
    expect(detachFromUnmoved(bound, new Set(["a", "b"]))).toBeNull();
  });

  it("frees only the end whose shape stayed behind", () => {
    expect(detachFromUnmoved(bound, new Set(["a"]))).toEqual({ endBinding: null });
  });

  it("makes a fully detached line a plain line", () => {
    expect(detachFromUnmoved(bound, new Set())).toEqual({
      startBinding: null,
      endBinding: null,
      arrow: false,
    });
  });
});

describe("remapDuplicatedBindings", () => {
  const bound = line({
    arrow: true,
    startBinding: { layerId: "a", anchor: "right" },
    endBinding: { layerId: "b", anchor: "left" },
  });

  it("points a duplicated line at the duplicated shapes", () => {
    expect(
      remapDuplicatedBindings(
        bound,
        new Map([
          ["a", "a2"],
          ["b", "b2"],
        ]),
      ),
    ).toEqual({
      startBinding: { layerId: "a2", anchor: "right" },
      endBinding: { layerId: "b2", anchor: "left" },
    });
  });

  it("frees an end whose shape wasn't duplicated", () => {
    expect(remapDuplicatedBindings(bound, new Map([["a", "a2"]]))).toEqual({
      startBinding: { layerId: "a2", anchor: "right" },
      endBinding: null,
    });
  });

  it("does nothing for a line that was never attached", () => {
    expect(remapDuplicatedBindings(line(), new Map())).toBeNull();
  });
});

describe("segmentIntersectsRect", () => {
  const box = { x: 0, y: 0, width: 100, height: 100 };

  it("is true when the segment crosses the rectangle", () => {
    expect(segmentIntersectsRect({ x: -50, y: 50 }, { x: 150, y: 50 }, box)).toBe(true);
  });

  it("is true when the segment lies inside", () => {
    expect(segmentIntersectsRect({ x: 10, y: 10 }, { x: 20, y: 20 }, box)).toBe(true);
  });

  it("is false for a diagonal whose bounding box overlaps the rectangle but whose line doesn't", () => {
    // Bounding box (-100,-100)-(200,10) overlaps the rect, but the line passes far above it.
    expect(segmentIntersectsRect({ x: -100, y: -100 }, { x: 200, y: 10 }, box)).toBe(false);
  });

  it("handles a zero-length segment", () => {
    expect(segmentIntersectsRect({ x: 50, y: 50 }, { x: 50, y: 50 }, box)).toBe(true);
    expect(segmentIntersectsRect({ x: 500, y: 500 }, { x: 500, y: 500 }, box)).toBe(false);
  });
});
