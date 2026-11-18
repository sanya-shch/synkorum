import { describe, it, expect } from "vitest";
import {
  getLineEndpoints,
  moveLineEndpoint,
  getArrowheadPoints,
  type LineBox,
} from "@/lib/canvas/line";

describe("getLineEndpoints", () => {
  it("top-left to bottom-right when flipX/flipY are both false", () => {
    const line: LineBox = { x: 0, y: 0, width: 100, height: 50, flipX: false, flipY: false };
    expect(getLineEndpoints(line)).toEqual({ start: { x: 0, y: 0 }, end: { x: 100, y: 50 } });
  });

  it("bottom-left to top-right when flipY is true", () => {
    const line: LineBox = { x: 0, y: 0, width: 100, height: 50, flipX: false, flipY: true };
    expect(getLineEndpoints(line)).toEqual({ start: { x: 0, y: 50 }, end: { x: 100, y: 0 } });
  });

  it("top-right to bottom-left when flipX is true", () => {
    const line: LineBox = { x: 0, y: 0, width: 100, height: 50, flipX: true, flipY: false };
    expect(getLineEndpoints(line)).toEqual({ start: { x: 100, y: 0 }, end: { x: 0, y: 50 } });
  });

  it("bottom-right to top-left when both are true", () => {
    const line: LineBox = { x: 0, y: 0, width: 100, height: 50, flipX: true, flipY: true };
    expect(getLineEndpoints(line)).toEqual({ start: { x: 100, y: 50 }, end: { x: 0, y: 0 } });
  });

  it("handles a purely horizontal line (height 0)", () => {
    const line: LineBox = { x: 10, y: 10, width: 80, height: 0, flipX: false, flipY: false };
    expect(getLineEndpoints(line)).toEqual({ start: { x: 10, y: 10 }, end: { x: 90, y: 10 } });
  });
});

describe("moveLineEndpoint", () => {
  const base: LineBox = { x: 0, y: 0, width: 100, height: 100, flipX: false, flipY: false };
  // start=(0,0), end=(100,100)

  it("moving the end endpoint keeps the start fixed", () => {
    const next = moveLineEndpoint(base, "end", { x: 200, y: 50 });
    expect(getLineEndpoints(next)).toEqual({ start: { x: 0, y: 0 }, end: { x: 200, y: 50 } });
  });

  it("moving the start endpoint keeps the end fixed", () => {
    const next = moveLineEndpoint(base, "start", { x: -50, y: 20 });
    expect(getLineEndpoints(next)).toEqual({ start: { x: -50, y: 20 }, end: { x: 100, y: 100 } });
  });

  it("dragging the start past the end flips the line's direction correctly", () => {
    // start dragged to the right of and below the (fixed) end -> the box's stored
    // "start" corner becomes the bottom-right, i.e. flipX=flipY=true.
    const next = moveLineEndpoint(base, "start", { x: 300, y: 300 });
    expect(getLineEndpoints(next)).toEqual({ start: { x: 300, y: 300 }, end: { x: 100, y: 100 } });
    expect(next).toMatchObject({
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      flipX: true,
      flipY: true,
    });
  });

  it("is idempotent: moving an endpoint to its own current position is a no-op", () => {
    const next = moveLineEndpoint(base, "end", { x: 100, y: 100 });
    expect(next).toEqual(base);
  });

  it("round-trips through several drags without drifting", () => {
    let line = base;
    line = moveLineEndpoint(line, "end", { x: 50, y: 200 });
    line = moveLineEndpoint(line, "start", { x: 10, y: 10 });
    line = moveLineEndpoint(line, "end", { x: 500, y: -20 });
    expect(getLineEndpoints(line)).toEqual({ start: { x: 10, y: 10 }, end: { x: 500, y: -20 } });
  });

  it("collapses to a zero-size line when both endpoints coincide", () => {
    const next = moveLineEndpoint(base, "start", { x: 100, y: 100 });
    expect(next).toMatchObject({ width: 0, height: 0 });
  });
});

describe("getArrowheadPoints", () => {
  const parse = (points: string) =>
    points.split(" ").map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x, y };
    });

  it("the first point is exactly the tip (the `to` point)", () => {
    const points = parse(getArrowheadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 12));
    expect(points[0]).toEqual({ x: 100, y: 0 });
  });

  it("the two back points are equidistant from the tip (an isosceles triangle)", () => {
    const points = parse(getArrowheadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 12));
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    expect(dist(points[0], points[1])).toBeCloseTo(dist(points[0], points[2]));
    expect(dist(points[0], points[1])).toBeCloseTo(12);
  });

  it("the two back points are distinct (a real triangle, not a degenerate line)", () => {
    const points = parse(getArrowheadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 12));
    expect(points[1]).not.toEqual(points[2]);
  });

  it("points back towards `from` for a horizontal line", () => {
    const points = parse(getArrowheadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 12));
    // both back points should be to the left of the tip (x < 100) for a rightward arrow
    expect(points[1].x).toBeLessThan(100);
    expect(points[2].x).toBeLessThan(100);
  });

  it("works for a vertical line", () => {
    const points = parse(getArrowheadPoints({ x: 0, y: 0 }, { x: 0, y: 100 }, 12));
    expect(points[1].y).toBeLessThan(100);
    expect(points[2].y).toBeLessThan(100);
  });

  it("degenerates gracefully (no NaN) for a zero-length line", () => {
    const points = parse(getArrowheadPoints({ x: 5, y: 5 }, { x: 5, y: 5 }, 12));
    for (const p of points) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});
