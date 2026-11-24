import { Point } from "@/types/canvas";

export interface LineBox {
  x: number;
  y: number;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
}

// Derives the two endpoints from the normalized box + flip flags (see the LineLayer
// comment in types/canvas.ts for why the box stays non-negative).
export function getLineEndpoints(line: LineBox): { start: Point; end: Point } {
  const start = {
    x: line.flipX ? line.x + line.width : line.x,
    y: line.flipY ? line.y + line.height : line.y,
  };
  const end = {
    x: line.flipX ? line.x : line.x + line.width,
    y: line.flipY ? line.y : line.y + line.height,
  };
  return { start, end };
}

// Builds the normalized box + flip flags for a line that runs from `start` to `end`.
export function lineFromEndpoints(start: Point, end: Point): LineBox {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
    flipX: start.x > end.x,
    flipY: start.y > end.y,
  };
}

// Moves one endpoint of the line to `point`, keeping the other endpoint fixed, and
// returns the new normalized box + flip flags. Used by the line's own 2-handle drag
// (not the generic 8-handle box resize, which would move both endpoints at once for
// a diagonal line - see the ResizingLine comment in types/canvas.ts).
export function moveLineEndpoint(line: LineBox, which: "start" | "end", point: Point): LineBox {
  const { start, end } = getLineEndpoints(line);

  return which === "start" ? lineFromEndpoints(point, end) : lineFromEndpoints(start, point);
}

export const getLineLength = (line: LineBox) => Math.hypot(line.width, line.height);

// Where the visible stroke should stop so it doesn't poke through the tip of an arrowhead
// of the given size: a little inside the end point, along the line. Lines shorter than
// that keep their full length.
export function getStrokeEnd(from: Point, to: Point, arrowSize: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const inset = arrowSize * 0.8;
  if (length <= inset) return to;

  const ratio = (length - inset) / length;
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
}

// Three SVG points ("x,y x,y x,y") for a filled triangle arrowhead at `to`, pointing
// away from `from`. Degenerates gracefully (an overlapping/zero-area triangle) for a
// zero-length line rather than producing NaN.
export function getArrowheadPoints(from: Point, to: Point, size = 12): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = Math.PI / 7; // ~25.7deg half-angle - a reasonably narrow arrowhead

  const back1 = {
    x: to.x - size * Math.cos(angle - spread),
    y: to.y - size * Math.sin(angle - spread),
  };
  const back2 = {
    x: to.x - size * Math.cos(angle + spread),
    y: to.y - size * Math.sin(angle + spread),
  };

  return [to, back1, back2].map((p) => `${p.x},${p.y}`).join(" ");
}
