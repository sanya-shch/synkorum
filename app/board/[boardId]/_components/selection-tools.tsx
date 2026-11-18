"use client";

import { memo } from "react";
import {
  BringToFront,
  SendToBack,
  Trash2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
} from "lucide-react";

import { Hint } from "@/components/hint";
import { Camera, Color } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { useMutation, useSelf } from "@liveblocks/react";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import {
  alignLeft,
  alignCenterHorizontal,
  alignRight,
  alignTop,
  alignMiddleVertical,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  type LayerBounds,
  type PositionPatch,
} from "@/lib/canvas/alignment";

import { ColorPicker } from "./color-picker";

interface SelectionToolsProps {
  camera: Camera;
  setLastUsedColor: (color: Color) => void;
}

export const SelectionTools = memo(({ camera, setLastUsedColor }: SelectionToolsProps) => {
  const selection = useSelf((me) => me.presence.selection)!;

  const moveToFront = useMutation(
    ({ storage }) => {
      const liveLayerIds = storage.get("layerIds");
      const indices: number[] = [];

      const arr = liveLayerIds.toJSON();

      for (let i = 0; i < arr.length; i++) {
        if (selection.includes(arr[i])) {
          indices.push(i);
        }
      }

      for (let i = indices.length - 1; i >= 0; i--) {
        liveLayerIds.move(indices[i], arr.length - 1 - (indices.length - 1 - i));
      }
    },
    [selection],
  );

  const moveToBack = useMutation(
    ({ storage }) => {
      const liveLayerIds = storage.get("layerIds");
      const indices: number[] = [];

      const arr = liveLayerIds.toJSON();

      for (let i = 0; i < arr.length; i++) {
        if (selection.includes(arr[i])) {
          indices.push(i);
        }
      }

      for (let i = 0; i < indices.length; i++) {
        liveLayerIds.move(indices[i], i);
      }
    },
    [selection],
  );

  const setFill = useMutation(
    ({ storage }, fill: Color) => {
      const liveLayers = storage.get("layers");
      setLastUsedColor(fill);

      selection?.forEach((id) => {
        liveLayers.get(id)?.set("fill", fill);
      });
    },
    [selection, setLastUsedColor],
  );

  const deleteLayers = useDeleteLayers();

  // A single useMutation callback batches all the storage writes it makes into one
  // undo step, so aligning/distributing several layers undoes in a single Ctrl+Z.
  const applyPositions = useMutation(
    ({ storage }, computePatch: (layers: LayerBounds) => PositionPatch) => {
      const liveLayers = storage.get("layers");
      const bounds: LayerBounds = {};

      for (const id of selection) {
        const layer = liveLayers.get(id);
        if (!layer) continue;
        bounds[id] = {
          x: layer.get("x"),
          y: layer.get("y"),
          width: layer.get("width"),
          height: layer.get("height"),
        };
      }

      const patch = computePatch(bounds);
      for (const [id, delta] of Object.entries(patch)) {
        liveLayers.get(id)?.update(delta);
      }
    },
    [selection],
  );

  const selectionBounds = useSelectionBounds();

  if (!selectionBounds) {
    return null;
  }

  const x = (selectionBounds.width / 2 + selectionBounds.x) * camera.zoom + camera.x;
  const y = selectionBounds.y * camera.zoom + camera.y;

  return (
    <div
      className="absolute z-10 flex select-none rounded-2xl border bg-white p-2 shadow-lg shadow-black/10"
      style={{
        transform: `translate(
          calc(${x}px - 50%),
          calc(${y - 16}px - 100%)
        )`,
      }}
    >
      <ColorPicker onChange={setFill} />

      {selection.length > 1 && (
        <div className="flex flex-col gap-y-1 pr-2 mr-2 border-r border-border">
          <div className="flex items-center gap-x-0.5">
            <Hint label="Align left">
              <Button variant="board" size="icon" onClick={() => applyPositions(alignLeft)}>
                <AlignStartVertical />
              </Button>
            </Hint>
            <Hint label="Align center">
              <Button
                variant="board"
                size="icon"
                onClick={() => applyPositions(alignCenterHorizontal)}
              >
                <AlignCenterVertical />
              </Button>
            </Hint>
            <Hint label="Align right">
              <Button variant="board" size="icon" onClick={() => applyPositions(alignRight)}>
                <AlignEndVertical />
              </Button>
            </Hint>
          </div>

          <div className="flex items-center gap-x-0.5">
            <Hint label="Align top">
              <Button variant="board" size="icon" onClick={() => applyPositions(alignTop)}>
                <AlignStartHorizontal />
              </Button>
            </Hint>
            <Hint label="Align middle">
              <Button
                variant="board"
                size="icon"
                onClick={() => applyPositions(alignMiddleVertical)}
              >
                <AlignCenterHorizontal />
              </Button>
            </Hint>
            <Hint label="Align bottom">
              <Button variant="board" size="icon" onClick={() => applyPositions(alignBottom)}>
                <AlignEndHorizontal />
              </Button>
            </Hint>
          </div>
        </div>
      )}

      {selection.length > 2 && (
        <div className="flex flex-col gap-y-1 pr-2 mr-2 border-r border-border">
          <Hint label="Distribute horizontally">
            <Button
              variant="board"
              size="icon"
              onClick={() => applyPositions(distributeHorizontally)}
            >
              <AlignHorizontalDistributeCenter />
            </Button>
          </Hint>
          <Hint label="Distribute vertically">
            <Button
              variant="board"
              size="icon"
              onClick={() => applyPositions(distributeVertically)}
            >
              <AlignVerticalDistributeCenter />
            </Button>
          </Hint>
        </div>
      )}

      <div className="flex flex-col gap-y-0.5">
        <Hint label="Bring to front">
          <Button onClick={moveToFront} variant="board" size="icon">
            <BringToFront />
          </Button>
        </Hint>
        <Hint label="Send to back" side="bottom">
          <Button onClick={moveToBack} variant="board" size="icon">
            <SendToBack />
          </Button>
        </Hint>
      </div>

      <div className="flex items-center pl-2 ml-2 border-l border-border">
        <Hint label="Delete">
          <Button variant="board" size="icon" onClick={deleteLayers}>
            <Trash2 />
          </Button>
        </Hint>
      </div>
    </div>
  );
});

SelectionTools.displayName = "SelectionTools";
