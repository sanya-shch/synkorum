import { XYWH } from "@/types/canvas";

// Pure geometry for aligning/distributing a multi-selection. Each function takes
// the current bounds of every selected layer (keyed by layer id) and returns only
// the {x, y} patches that changed - callers apply those to Liveblocks storage.

export type LayerBounds = Record<string, XYWH>;
export type PositionPatch = Record<string, { x?: number; y?: number }>;

function boundingBox(bounds: XYWH[]): XYWH {
  const left = Math.min(...bounds.map((b) => b.x));
  const top = Math.min(...bounds.map((b) => b.y));
  const right = Math.max(...bounds.map((b) => b.x + b.width));
  const bottom = Math.max(...bounds.map((b) => b.y + b.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function mapX(layers: LayerBounds, next: (b: XYWH, box: XYWH) => number): PositionPatch {
  const entries = Object.entries(layers);
  const box = boundingBox(entries.map(([, b]) => b));
  const patch: PositionPatch = {};
  for (const [id, b] of entries) {
    const x = next(b, box);
    if (x !== b.x) patch[id] = { x };
  }
  return patch;
}

function mapY(layers: LayerBounds, next: (b: XYWH, box: XYWH) => number): PositionPatch {
  const entries = Object.entries(layers);
  const box = boundingBox(entries.map(([, b]) => b));
  const patch: PositionPatch = {};
  for (const [id, b] of entries) {
    const y = next(b, box);
    if (y !== b.y) patch[id] = { y };
  }
  return patch;
}

export const alignLeft = (layers: LayerBounds) => mapX(layers, (b, box) => box.x);
export const alignRight = (layers: LayerBounds) =>
  mapX(layers, (b, box) => box.x + box.width - b.width);
export const alignCenterHorizontal = (layers: LayerBounds) =>
  mapX(layers, (b, box) => box.x + box.width / 2 - b.width / 2);

export const alignTop = (layers: LayerBounds) => mapY(layers, (b, box) => box.y);
export const alignBottom = (layers: LayerBounds) =>
  mapY(layers, (b, box) => box.y + box.height - b.height);
export const alignMiddleVertical = (layers: LayerBounds) =>
  mapY(layers, (b, box) => box.y + box.height / 2 - b.height / 2);

// Equalizes the gaps between layer edges along one axis. Needs at least 3 layers -
// with 2 there is only one gap, so there is nothing to equalize.
function distribute(layers: LayerBounds, axis: "x" | "y", size: "width" | "height"): PositionPatch {
  const entries = Object.entries(layers);
  if (entries.length < 3) return {};

  const sorted = [...entries].sort((a, b) => a[1][axis] - b[1][axis]);
  const first = sorted[0][1];
  const last = sorted[sorted.length - 1][1];

  const span = last[axis] + last[size] - first[axis];
  const totalSize = sorted.reduce((sum, [, b]) => sum + b[size], 0);
  const gap = (span - totalSize) / (sorted.length - 1);

  const patch: PositionPatch = {};
  let cursor = first[axis];
  for (const [id, b] of sorted) {
    if (cursor !== b[axis]) patch[id] = axis === "x" ? { x: cursor } : { y: cursor };
    cursor += b[size] + gap;
  }
  return patch;
}

export const distributeHorizontally = (layers: LayerBounds) => distribute(layers, "x", "width");
export const distributeVertically = (layers: LayerBounds) => distribute(layers, "y", "height");

// Moves every selected layer by the same (dx, dy) - used for the arrow-key nudge
// shortcut. Unlike the align/distribute functions above, this never depends on the
// other layers' bounds, so every layer always gets a patch (nothing to dedupe).
export function nudge(layers: LayerBounds, dx: number, dy: number): PositionPatch {
  const patch: PositionPatch = {};
  for (const [id, b] of Object.entries(layers)) {
    patch[id] = { x: b.x + dx, y: b.y + dy };
  }
  return patch;
}
