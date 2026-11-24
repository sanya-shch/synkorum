"use client";

import { memo } from "react";

import { Anchor, LayerType, Point, Side, XYWH } from "@/types/canvas";
import { useSelf, useStorage, shallow } from "@liveblocks/react";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { getLineEndpoints } from "@/lib/canvas/line";
import { ANCHORS, getAnchorPoint, isConnectable } from "@/lib/canvas/connectors";

interface SelectionBoxProps {
  onResizeHandlePointerDown: (corner: Side, initialBounds: XYWH) => void;
  onLineEndpointPointerDown: (layerId: string, which: "start" | "end") => void;
  // Pressing a connector dot next to the selected shape: `origin` is the magnet on the shape.
  onConnectorPointerDown: (shapeId: string, anchor: Anchor, origin: Point) => void;
  readOnly?: boolean;
  zoom: number;
}

// Visual (screen-space) target size for a resize handle, regardless of zoom level.
const HANDLE_SCREEN_SIZE = 8;

// The connector dots sit this far (screen pixels) outside the middle of each side, clear of
// the resize handles that sit on the outline itself.
const CONNECTOR_OFFSET_SCREEN = 18;
const CONNECTOR_DIRECTION: Record<Anchor, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const SelectionBox = memo(
  ({
    onResizeHandlePointerDown,
    onLineEndpointPointerDown,
    onConnectorPointerDown,
    readOnly,
    zoom,
  }: SelectionBoxProps) => {
    const soleLayerId = useSelf((me) =>
      me.presence.selection.length === 1 ? me.presence.selection[0] : null,
    );

    // Counter-scale the handles so they stay ~8 screen px at any zoom level - the
    // world <g> they live in is already scaled by `zoom`.
    const HANDLE_WIDTH = HANDLE_SCREEN_SIZE / zoom;

    const isShowingHandles = useStorage(
      (root) => !readOnly && soleLayerId && root.layers[soleLayerId]?.type !== LayerType.Path,
    );

    // A single selected shape a line can be attached to shows connector dots on its sides.
    const isConnectableShape = useStorage((root) => {
      const layer = soleLayerId ? root.layers[soleLayerId] : null;
      return !readOnly && !!layer && isConnectable(layer);
    });

    // A Line gets its own 2 endpoint handles instead of the generic 8-handle box:
    // dragging a corner/edge handle on a 2-point line would move both endpoints at
    // once in ways that don't match where the user is actually dragging (see the
    // ResizingLine comment in types/canvas.ts).
    const soleLine = useStorage((root) => {
      if (!soleLayerId) return null;
      const layer = root.layers[soleLayerId];
      return layer?.type === LayerType.Line ? layer : null;
    }, shallow);

    const bounds = useSelectionBounds();

    if (!bounds) {
      return null;
    }

    if (soleLine && !readOnly) {
      const { start, end } = getLineEndpoints(soleLine);
      const handleRadius = HANDLE_WIDTH / 2;

      return (
        <>
          {[
            { point: start, which: "start" as const, bound: !!soleLine.startBinding },
            { point: end, which: "end" as const, bound: !!soleLine.endBinding },
          ].map(({ point, which, bound }) => (
            <circle
              key={which}
              // Filled blue = this end is attached to a shape, white = free.
              className={
                bound
                  ? "fill-blue-500 stroke-1 stroke-white"
                  : "fill-white stroke-1 stroke-blue-500"
              }
              vectorEffect="non-scaling-stroke"
              cx={point.x}
              cy={point.y}
              r={handleRadius}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onLineEndpointPointerDown(soleLayerId!, which);
              }}
            />
          ))}
        </>
      );
    }

    return (
      <>
        <rect
          className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
          vectorEffect="non-scaling-stroke"
          style={{
            transform: `translate(${bounds.x}px, ${bounds.y}px)`,
          }}
          x={0}
          y={0}
          width={bounds.width}
          height={bounds.height}
        />
        {isConnectableShape &&
          ANCHORS.map((anchor) => {
            const edge = getAnchorPoint(bounds, anchor);
            const direction = CONNECTOR_DIRECTION[anchor];
            const cx = edge.x + (direction.x * CONNECTOR_OFFSET_SCREEN) / zoom;
            const cy = edge.y + (direction.y * CONNECTOR_OFFSET_SCREEN) / zoom;

            return (
              <g
                key={anchor}
                data-testid={`connector-${anchor}`}
                style={{ cursor: "crosshair" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onConnectorPointerDown(soleLayerId!, anchor, edge);
                }}
              >
                {/* Generous invisible hit area around the small dot. */}
                <circle cx={cx} cy={cy} r={12 / zoom} fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={5 / zoom}
                  className="fill-blue-500 stroke-white"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        {isShowingHandles && (
          <>
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2}px,
                  ${bounds.y - HANDLE_WIDTH / 2}px
                )
              `,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top + Side.Left, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "ns-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px, 
                  ${bounds.y - HANDLE_WIDTH / 2}px
                )
              `,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px,
                  ${bounds.y - HANDLE_WIDTH / 2}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top + Side.Right, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "ew-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px, 
                  ${bounds.y + bounds.height / 2 - HANDLE_WIDTH / 2}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Right, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2 + bounds.width}px, 
                  ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Bottom + Side.Right, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "ns-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x + bounds.width / 2 - HANDLE_WIDTH / 2}px,
                  ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Bottom, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2}px,
                  ${bounds.y - HANDLE_WIDTH / 2 + bounds.height}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Bottom + Side.Left, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              vectorEffect="non-scaling-stroke"
              x={0}
              y={0}
              style={{
                cursor: "ew-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `
                translate(
                  ${bounds.x - HANDLE_WIDTH / 2}px,
                  ${bounds.y - HANDLE_WIDTH / 2 + bounds.height / 2}px
                )`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Left, bounds);
              }}
            />
          </>
        )}
      </>
    );
  },
);

SelectionBox.displayName = "SelectionBox";
