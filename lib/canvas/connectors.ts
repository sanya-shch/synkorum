import type { Anchor, Layer, LineBinding, LineLayer, Point, XYWH } from "@/types/canvas";
import { LayerType } from "@/types/canvas";
import { getLineEndpoints, lineFromEndpoints } from "@/lib/canvas/line";

// "Connectors": a line whose ends can be magnetized to the sides of shapes. The pure
// geometry and rules live here; lib/canvas/connectors-live.ts applies them to the
// Liveblocks storage.

export const ANCHORS: readonly Anchor[] = ["top", "right", "bottom", "left"];

// How close (in screen pixels, so it feels the same at any zoom) a dragged line end has to
// get to a shape's magnet to snap to it.
export const SNAP_RADIUS_PX = 18;

// A line dragged out shorter than this (in board units) counts as a click.
export const MIN_LINE_LENGTH = 6;

// What a plain click with the line tool produces: a horizontal line of this length.
export const DEFAULT_LINE_LENGTH = 140;

// Layers a line end can attach to. Lines and freehand paths can't be targets.
export const isConnectable = (layer: { type: LayerType }) =>
  layer.type === LayerType.Rectangle ||
  layer.type === LayerType.Ellipse ||
  layer.type === LayerType.Diamond ||
  layer.type === LayerType.Note ||
  layer.type === LayerType.Text;

// The midpoint of one side of a box. For a rectangle/note/text that is the middle of an
// edge; for an ellipse and a diamond it is exactly where the outline touches the box.
export function getAnchorPoint(box: XYWH, anchor: Anchor): Point {
  switch (anchor) {
    case "top":
      return { x: box.x + box.width / 2, y: box.y };
    case "bottom":
      return { x: box.x + box.width / 2, y: box.y + box.height };
    case "left":
      return { x: box.x, y: box.y + box.height / 2 };
    case "right":
      return { x: box.x + box.width, y: box.y + box.height / 2 };
  }
}

export type SnapTarget = { layerId: string; anchor: Anchor; point: Point };

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const nearestAnchor = (box: XYWH, point: Point) => {
  let best: { anchor: Anchor; point: Point; dist: number } | null = null;

  for (const anchor of ANCHORS) {
    const anchorPoint = getAnchorPoint(box, anchor);
    const dist = distance(anchorPoint, point);
    if (best === null || dist < best.dist) best = { anchor, point: anchorPoint, dist };
  }

  return best!;
};

const contains = (box: XYWH, point: Point) =>
  point.x >= box.x &&
  point.x <= box.x + box.width &&
  point.y >= box.y &&
  point.y <= box.y + box.height;

// Which magnet, if any, a dragged line end at `point` snaps to:
//  1. over a shape's body -> that shape's nearest side (the topmost shape wins);
//  2. otherwise the nearest magnet of any shape within `radius` (world units - pass a
//     screen-pixel distance divided by the zoom).
// `layerIds` is in paint order (back to front), as stored on the board.
export function findSnapTarget(
  point: Point,
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  { radius, excludeIds = [] }: { radius: number; excludeIds?: readonly string[] },
): SnapTarget | null {
  const excluded = new Set(excludeIds);

  for (let i = layerIds.length - 1; i >= 0; i--) {
    const layerId = layerIds[i];
    const layer = layers.get(layerId);
    if (!layer || excluded.has(layerId) || !isConnectable(layer)) continue;

    if (contains(layer, point)) {
      const { anchor, point: anchorPoint } = nearestAnchor(layer, point);
      return { layerId, anchor, point: anchorPoint };
    }
  }

  let best: (SnapTarget & { dist: number }) | null = null;
  for (let i = layerIds.length - 1; i >= 0; i--) {
    const layerId = layerIds[i];
    const layer = layers.get(layerId);
    if (!layer || excluded.has(layerId) || !isConnectable(layer)) continue;

    const { anchor, point: anchorPoint, dist } = nearestAnchor(layer, point);
    if (dist <= radius && (best === null || dist < best.dist)) {
      best = { layerId, anchor, point: anchorPoint, dist };
    }
  }

  return best && { layerId: best.layerId, anchor: best.anchor, point: best.point };
}

// Holding Shift while dragging an unattached end: snap the direction to multiples of
// `stepDegrees` (default 45), keeping the distance from the fixed end.
export function constrainAngle(from: Point, to: Point, stepDegrees = 45): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return to;

  const step = (stepDegrees * Math.PI) / 180;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;

  return { x: from.x + length * Math.cos(angle), y: from.y + length * Math.sin(angle) };
}

// Lines saved before connectors existed have no `arrow` field and always drew one.
export const lineHasArrow = (line: Pick<LineLayer, "arrow">) => line.arrow ?? true;

type Bindings = Pick<LineLayer, "startBinding" | "endBinding">;

const isBound = ({ startBinding, endBinding }: Bindings) => Boolean(startBinding || endBinding);

// The arrow follows the bindings: a line that is attached to a shape ends in an arrowhead,
// a line attached to nothing is a plain line. It only changes when a line goes from
// "attached to something" to "attached to nothing" or back, so merely dragging the end of
// an older, never-bound line doesn't silently strip its arrowhead.
export function arrowPatch(before: Bindings, after: Bindings): { arrow?: boolean } {
  const wasBound = isBound(before);
  const nowBound = isBound(after);

  return wasBound === nowBound ? {} : { arrow: nowBound };
}

const EPSILON = 1e-6;

type Resolved = { point: Point | null; dangling: boolean };

const resolveBinding = (
  binding: LineBinding | null | undefined,
  layers: ReadonlyMap<string, Layer>,
): Resolved => {
  if (!binding) return { point: null, dangling: false };

  const target = layers.get(binding.layerId);
  if (!target || !isConnectable(target)) return { point: null, dangling: true };

  return { point: getAnchorPoint(target, binding.anchor), dangling: false };
};

// What to write to `line` so its attached ends sit on their magnets again (after a shape
// moved, resized, ...). Also heals a binding whose shape no longer exists: that end stays
// where it is and becomes free. Returns null when nothing needs to change.
export function computeLineRoute(
  line: LineLayer,
  layers: ReadonlyMap<string, Layer>,
): Partial<LineLayer> | null {
  const current = getLineEndpoints(line);
  const start = resolveBinding(line.startBinding, layers);
  const end = resolveBinding(line.endBinding, layers);

  const patch: Partial<LineLayer> = {};
  const next: Bindings = {
    startBinding: start.dangling ? null : line.startBinding,
    endBinding: end.dangling ? null : line.endBinding,
  };

  if (start.dangling) patch.startBinding = null;
  if (end.dangling) patch.endBinding = null;
  Object.assign(patch, arrowPatch(line, next));

  const box = lineFromEndpoints(start.point ?? current.start, end.point ?? current.end);
  const moved =
    Math.abs(box.x - line.x) > EPSILON ||
    Math.abs(box.y - line.y) > EPSILON ||
    Math.abs(box.width - line.width) > EPSILON ||
    Math.abs(box.height - line.height) > EPSILON ||
    box.flipX !== line.flipX ||
    box.flipY !== line.flipY;
  if (moved) Object.assign(patch, box);

  return Object.keys(patch).length > 0 ? patch : null;
}

// A line that was moved without (all of) the shapes it is attached to comes loose from
// the ones that stayed behind - otherwise it would be dragged away from its magnet.
export function detachFromUnmoved(
  line: LineLayer,
  movedIds: ReadonlySet<string>,
): Partial<LineLayer> | null {
  const startBinding =
    line.startBinding && movedIds.has(line.startBinding.layerId) ? line.startBinding : null;
  const endBinding =
    line.endBinding && movedIds.has(line.endBinding.layerId) ? line.endBinding : null;

  const patch: Partial<LineLayer> = {};
  if (line.startBinding && !startBinding) patch.startBinding = null;
  if (line.endBinding && !endBinding) patch.endBinding = null;

  if (Object.keys(patch).length === 0) return null;
  return { ...patch, ...arrowPatch(line, { startBinding, endBinding }) };
}

// When layers are duplicated together, a duplicated line attaches to the duplicated
// shapes (not the originals). Ends whose shape wasn't duplicated become free.
export function remapDuplicatedBindings(
  line: LineLayer,
  idMap: ReadonlyMap<string, string>,
): Partial<LineLayer> | null {
  if (!line.startBinding && !line.endBinding) return null;

  const remap = (binding: LineBinding | null | undefined) => {
    const layerId = binding && idMap.get(binding.layerId);
    return binding && layerId ? { ...binding, layerId } : null;
  };

  const next: Bindings = {
    startBinding: remap(line.startBinding),
    endBinding: remap(line.endBinding),
  };
  return { ...next, ...arrowPatch(line, next) };
}

// Does the segment a-b touch the rectangle? (Liang-Barsky clipping.) Used so a rubber-band
// selection only picks up a diagonal line when it actually crosses it, not when it merely
// overlaps the line's bounding box.
export function segmentIntersectsRect(a: Point, b: Point, rect: XYWH): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };

  return (
    clip(-dx, a.x - rect.x) &&
    clip(dx, rect.x + rect.width - a.x) &&
    clip(-dy, a.y - rect.y) &&
    clip(dy, rect.y + rect.height - a.y)
  );
}
