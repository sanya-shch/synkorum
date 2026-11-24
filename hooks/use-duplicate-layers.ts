import { nanoid } from "nanoid";
import { useSelf, useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { MAX_LAYERS } from "@/lib/constants";
import { notifyLayerLimit } from "@/lib/layer-limit";
import { remapDuplicatedBindings } from "@/lib/canvas/connectors";
import { LayerType } from "@/types/canvas";

// Duplicates every selected layer with a small offset and selects the copies, so the
// duplicate lands where you'd expect (Figma/Miro-style Ctrl/Cmd+D) and is ready to drag.
const OFFSET = 10;

export const useDuplicateLayers = () => {
  const selection = useSelf((me) => me.presence.selection);

  return useMutation(
    ({ storage, self, setMyPresence }) => {
      if (!self.canWrite) return;

      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      const newIds: string[] = [];
      const copies = new Map<string, string>();

      for (const id of selection ?? []) {
        if (liveLayers.size >= MAX_LAYERS) {
          notifyLayerLimit();
          break;
        }

        const layer = liveLayers.get(id);
        if (!layer) continue;

        const data = layer.toJSON();
        const newId = nanoid();

        liveLayers.set(newId, new LiveObject({ ...data, x: data.x + OFFSET, y: data.y + OFFSET }));
        liveLayerIds.push(newId);
        newIds.push(newId);
        copies.set(id, newId);
      }

      // A duplicated line attaches to the duplicated shapes, not to the originals; ends whose
      // shape wasn't duplicated come loose.
      for (const newId of newIds) {
        const copy = liveLayers.get(newId);
        const data = copy?.toJSON();
        if (!copy || data?.type !== LayerType.Line) continue;

        const patch = remapDuplicatedBindings(data, copies);
        if (patch) copy.update(patch);
      }

      if (newIds.length > 0) {
        setMyPresence({ selection: newIds }, { addToHistory: true });
      }
    },
    [selection],
  );
};
