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

// Moves one endpoint of the line to `point`, keeping the other endpoint fixed, and
// returns the new normalized box + flip flags. Used by the line's own 2-handle drag
// (not the generic 8-handle box resize, which would move both endpoints at once for
// a diagonal line - see the ResizingLine comment in types/canvas.ts).
export function moveLineEndpoint(line: LineBox, which: "start" | "end", point: Point): LineBox {
  const { start, end } = getLineEndpoints(line);
  const fixed = which === "start" ? end : start;
  const moved = point;
  const newStart = which === "start" ? moved : fixed;
  const newEnd = which === "start" ? fixed : moved;

  return {
    x: Math.min(newStart.x, newEnd.x),
    y: Math.min(newStart.y, newEnd.y),
    width: Math.abs(newEnd.x - newStart.x),
    height: Math.abs(newEnd.y - newStart.y),
    flipX: newStart.x > newEnd.x,
    flipY: newStart.y > newEnd.y,
  };
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
