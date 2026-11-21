import { nanoid } from "nanoid";
import { useSelf, useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { MAX_LAYERS } from "@/lib/constants";
import { notifyLayerLimit } from "@/lib/layer-limit";

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
      }

      if (newIds.length > 0) {
        setMyPresence({ selection: newIds }, { addToHistory: true });
      }
    },
    [selection],
  );
};
