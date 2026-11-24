import type { LiveMap, LiveObject } from "@liveblocks/client";
import type { Color, Layer, PathLayer, Point, XYWH } from "@/types/canvas";
import { LayerType, Side } from "@/types/canvas";
import { segmentIntersectsRect } from "@/lib/canvas/connectors";
import { getLineEndpoints } from "@/lib/canvas/line";

export function resizeBounds(bounds: XYWH, corner: Side, point: Point, lockAspect = false): XYWH {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width);
    result.width = Math.abs(bounds.x + bounds.width - point.x);
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x);
    result.width = Math.abs(point.x - bounds.x);
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height);
    result.height = Math.abs(bounds.y + bounds.height - point.y);
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y);
    result.height = Math.abs(point.y - bounds.y);
  }

  // Aspect-ratio lock only makes sense on a corner handle - a single edge handle only
  // drags one axis, so there's no natural "other" delta to derive a ratio from.
  const isCornerHandle =
    (corner & (Side.Left | Side.Right)) !== 0 && (corner & (Side.Top | Side.Bottom)) !== 0;

  if (lockAspect && isCornerHandle && bounds.width !== 0 && bounds.height !== 0) {
    // Whichever axis the pointer moved further along (relative to its original size)
    // wins, and the other axis is scaled to match - this is what "drag a corner with
    // Shift held" means in most design tools.
    const scale = Math.max(result.width / bounds.width, result.height / bounds.height);
    const width = bounds.width * scale;
    const height = bounds.height * scale;

    result.x = (corner & Side.Left) === Side.Left ? bounds.x + bounds.width - width : bounds.x;
    result.y = (corner & Side.Top) === Side.Top ? bounds.y + bounds.height - height : bounds.y;
    result.width = width;
    result.height = height;
  }

  return result;
}

// storage.get("layers") returns a live LiveMap: its entries are internal, not own
// enumerable properties, so Object.entries(liveLayers) always returns []. Iterate it
// directly and unwrap each LiveObject to a plain Layer with .toJSON().
export function liveLayersToMap(
  liveLayers: LiveMap<string, LiveObject<Layer>>,
): ReadonlyMap<string, Layer> {
  return new Map(Array.from(liveLayers, ([id, layer]) => [id, layer.toJSON()] as const));
}

export function findIntersectingLayersWithRectangle(
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  a: Point,
  b: Point,
) {
  const rect = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };

  const ids = [];

  for (const layerId of layerIds) {
    const layer = layers.get(layerId);

    if (layer == null) {
      continue;
    }

    // A diagonal line is only "in" the net where the line itself passes through it, not
    // wherever its (much larger) bounding box happens to overlap.
    if (layer.type === LayerType.Line) {
      const { start, end } = getLineEndpoints(layer);
      if (segmentIntersectsRect(start, end, rect)) ids.push(layerId);
      continue;
    }

    const { x, y, height, width } = layer;

    if (
      rect.x + rect.width > x &&
      rect.x < x + width &&
      rect.y + rect.height > y &&
      rect.y < y + height
    ) {
      ids.push(layerId);
    }
  }

  return ids;
}

export function penPointsToPathLayer(points: number[][], color: Color): PathLayer {
  if (points.length < 2) {
    throw new Error("Cannot transform points with less than 2 points");
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    const [x, y] = point;

    if (left > x) {
      left = x;
    }

    if (top > y) {
      top = y;
    }

    if (right < x) {
      right = x;
    }

    if (bottom < y) {
      bottom = y;
    }
  }

  return {
    type: LayerType.Path,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    fill: color,
    points: points.map(([x, y, pressure]) => [x - left, y - top, pressure]),
  };
}

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"],
  );

  d.push("Z");
  return d.join(" ");
}
