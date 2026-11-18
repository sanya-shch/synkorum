"use client";

import { memo } from "react";

import { LayerType } from "@/types/canvas";
import { useStorage } from "@liveblocks/react";
import { colorToCss } from "@/lib/canvas/color";

import { Rectangle } from "./rectangle";
import { Ellipse } from "./ellipse";
import { Diamond } from "./diamond";
import { Line } from "./line";
import { Text } from "./text";
import { Note } from "./note";
import { Path } from "./path";

interface LayerPreviewProps {
  id: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

export const LayerPreview = memo(
  ({ id, onLayerPointerDown, selectionColor }: LayerPreviewProps) => {
    const layer = useStorage((root) => root.layers[id]);

    if (!layer) {
      return null;
    }

    const content = (() => {
      switch (layer.type) {
        case LayerType.Rectangle:
          return (
            <Rectangle
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Ellipse:
          return (
            <Ellipse
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Diamond:
          return (
            <Diamond
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Line:
          return (
            <Line
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Note:
          return (
            <Note
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Text:
          return (
            <Text
              id={id}
              layer={layer}
              onPointerDown={onLayerPointerDown}
              selectionColor={selectionColor}
            />
          );
        case LayerType.Path:
          return (
            <Path
              key={id}
              points={layer.points}
              onPointerDown={(e) => onLayerPointerDown(e, id)}
              x={layer.x}
              y={layer.y}
              fill={layer.fill ? colorToCss(layer.fill) : "#000"}
              stroke={selectionColor}
            />
          );
        default:
          console.warn("Unknown layer type");
          return null;
      }
    })();

    // A stable test hook for E2E (which layer, of which type, is on screen) that
    // doesn't depend on any shape's internal markup.
    return (
      <g data-testid={`layer-${id}`} data-layer-type={LayerType[layer.type]}>
        {content}
      </g>
    );
  },
);

LayerPreview.displayName = "LayerPreview";
