import { useSelf, useMutation } from "@liveblocks/react";
import { healBoundLines } from "@/lib/canvas/connectors-live";

export const useDeleteLayers = () => {
  const selection = useSelf((me) => me.presence.selection);

  return useMutation(
    ({ storage, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");

      for (const id of selection!) {
        liveLayers.delete(id);

        const index = liveLayerIds.indexOf(id);

        if (index !== -1) {
          liveLayerIds.delete(index);
        }
      }

      // Lines that were attached to a deleted shape stay where they are, now free.
      healBoundLines(liveLayers);

      setMyPresence({ selection: [] }, { addToHistory: true });
    },
    [selection],
  );
};
