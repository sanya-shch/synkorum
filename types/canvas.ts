export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

// These numbers are persisted inside Liveblocks storage, so they are part of the data
// format: never renumber or reorder. A new layer type gets the next free number.
export enum LayerType {
  Rectangle = 0,
  Ellipse = 1,
  Path = 2,
  Text = 3,
  Note = 4,
  Diamond = 5,
  Line = 6,
}

// Every layer is placed by a bounding box and has a fill; most also carry text.
type BoxLayer<T extends LayerType> = {
  type: T;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type RectangleLayer = BoxLayer<LayerType.Rectangle>;

export type EllipseLayer = BoxLayer<LayerType.Ellipse>;

export type PathLayer = BoxLayer<LayerType.Path> & {
  points: number[][];
};

export type TextLayer = BoxLayer<LayerType.Text>;

export type NoteLayer = BoxLayer<LayerType.Note>;

export type DiamondLayer = BoxLayer<LayerType.Diamond>;

// x/y/width/height are always a normalized, non-negative bounding box (same
// convention as every other layer) so translate/duplicate/nudge/align/group-resize
// all work on a Line with no special-casing. flipX/flipY separately record which
// corner of that box is the line's start vs. end, so the line can point in any of
// the 4 diagonal directions (not just top-left-to-bottom-right).
//
// A line end can be "magnetized" to a shape (see lib/canvas/connectors.ts): the binding
// names the shape and the side whose midpoint the end is pinned to, and the end then
// follows that shape when it moves or is resized. These fields are optional so boards
// saved before connectors existed keep loading unchanged; `null` means "explicitly free".
export type LineLayer = {
  type: LayerType.Line;
  x: number;
  y: number;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  fill: Color;
  startBinding?: LineBinding | null;
  endBinding?: LineBinding | null;
  // Whether the arrowhead at the end is drawn. Missing on lines saved before this field
  // existed: those always had an arrowhead (see lineHasArrow in lib/canvas/connectors.ts).
  arrow?: boolean;
};

// The four magnets of a shape: the midpoints of its sides. For every connectable shape
// (rectangle, ellipse, diamond, note, text) these lie exactly on its outline.
export type Anchor = "top" | "right" | "bottom" | "left";

export type LineBinding = {
  layerId: string;
  anchor: Anchor;
};

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.SelectionNet;
      origin: Point;
      current?: Point;
    }
  | {
      mode: CanvasMode.Translating;
      current: Point;
    }
  | {
      mode: CanvasMode.Inserting;
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Diamond
        | LayerType.Line;
    }
  | {
      mode: CanvasMode.Pencil;
    }
  | {
      mode: CanvasMode.Pressing;
      origin: Point;
    }
  | {
      mode: CanvasMode.Resizing;
      initialBounds: XYWH;
      initialLayerBounds: Record<string, XYWH>;
      corner: Side;
    }
  | {
      // A single selected Line's own endpoint handle, as opposed to the generic
      // 8-handle box resize above - dragging a corner/edge handle on a 2-point line
      // moves BOTH endpoints in confusing ways, so a line gets exactly 2 handles
      // (one per endpoint) driven by this mode instead.
      mode: CanvasMode.ResizingLine;
      layerId: string;
      which: "start" | "end";
      // Set while a line that was just created is still being dragged out: from a shape's
      // magnet, or with the line tool. Such a line that ends up (almost) zero length is
      // cleaned up on release instead of being left behind as an invisible layer.
      created?: "magnet" | "tool";
    };

export enum CanvasMode {
  None,
  Pressing,
  SelectionNet,
  Translating,
  Inserting,
  Resizing,
  Pencil,
  ResizingLine,
}

export type Layer =
  RectangleLayer | EllipseLayer | PathLayer | TextLayer | NoteLayer | DiamondLayer | LineLayer;
