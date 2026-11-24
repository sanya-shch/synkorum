import { LiveObject, type LiveList, type LiveMap } from "@liveblocks/client";
import type { Color, Layer, LineBinding, Point } from "@/types/canvas";
import { LayerType } from "@/types/canvas";
import { liveLayersToMap } from "@/lib/canvas/layers";
import { computeLineRoute, detachFromUnmoved } from "@/lib/canvas/connectors";

type LiveLayers = LiveMap<string, LiveObject<Layer>>;

// Writes that keep lines attached to their shapes. They are meant to be called from inside
// the same `useMutation` that changed the shapes, so a shape move and the matching line
// updates are one storage transaction (and one undo step).

// Re-aims every line attached to one of `targetIds` at its shapes' current magnets.
export function rerouteBoundLines(liveLayers: LiveLayers, targetIds: ReadonlySet<string>) {
  const layers = liveLayersToMap(liveLayers);

  for (const [id, layer] of layers) {
    if (layer.type !== LayerType.Line) continue;

    const touchesTarget =
      (layer.startBinding && targetIds.has(layer.startBinding.layerId)) ||
      (layer.endBinding && targetIds.has(layer.endBinding.layerId));
    if (!touchesTarget) continue;

    const patch = computeLineRoute(layer, layers);
    if (patch) liveLayers.get(id)?.update(patch);
  }
}

// To call after `movedIds` were moved or resized: lines that are among them but whose
// shapes were left behind come loose; every line attached to a moved shape follows it.
export function afterLayersMoved(liveLayers: LiveLayers, movedIds: Iterable<string>) {
  const moved = new Set(movedIds);

  for (const id of moved) {
    const live = liveLayers.get(id);
    const data = live?.toJSON();
    if (!live || data?.type !== LayerType.Line) continue;

    const patch = detachFromUnmoved(data, moved);
    if (patch) live.update(patch);
  }

  rerouteBoundLines(liveLayers, moved);
}

// To call after layers were deleted: lines that were attached to a deleted shape keep their
// position and become free.
export function healBoundLines(liveLayers: LiveLayers) {
  const layers = liveLayersToMap(liveLayers);

  for (const [id, layer] of layers) {
    if (layer.type !== LayerType.Line || (!layer.startBinding && !layer.endBinding)) continue;

    const patch = computeLineRoute(layer, layers);
    if (patch) liveLayers.get(id)?.update(patch);
  }
}

// Adds a zero-length line starting at `start` (optionally already attached to a shape's
// magnet) to the board. The caller then drags its end out.
export function insertLine(
  liveLayers: LiveLayers,
  liveLayerIds: LiveList<string>,
  layerId: string,
  start: Point,
  fill: Color,
  startBinding: LineBinding | null,
) {
  liveLayers.set(
    layerId,
    new LiveObject<Layer>({
      type: LayerType.Line,
      x: start.x,
      y: start.y,
      width: 0,
      height: 0,
      flipX: false,
      flipY: false,
      fill,
      startBinding,
      endBinding: null,
      arrow: startBinding !== null,
    }),
  );
  liveLayerIds.push(layerId);
}
