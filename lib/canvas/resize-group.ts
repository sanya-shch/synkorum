import { XYWH } from "@/types/canvas";
import type { LayerBounds } from "@/lib/canvas/alignment";

// Scales every layer in `initialLayerBounds` by whatever factor `initialGroupBounds`
// changed into `newGroupBounds`, keeping each layer's position and size relative to
// the group. With a single-layer selection this reduces to resizing that layer
// directly, since it IS the group.
export function resizeGroup(
  initialGroupBounds: XYWH,
  initialLayerBounds: LayerBounds,
  newGroupBounds: XYWH,
): Record<string, XYWH> {
  const scaleX =
    initialGroupBounds.width === 0 ? 1 : newGroupBounds.width / initialGroupBounds.width;
  const scaleY =
    initialGroupBounds.height === 0 ? 1 : newGroupBounds.height / initialGroupBounds.height;

  const result: Record<string, XYWH> = {};
  for (const [id, b] of Object.entries(initialLayerBounds)) {
    result[id] = {
      x: newGroupBounds.x + (b.x - initialGroupBounds.x) * scaleX,
      y: newGroupBounds.y + (b.y - initialGroupBounds.y) * scaleY,
      width: b.width * scaleX,
      height: b.height * scaleY,
    };
  }
  return result;
}
