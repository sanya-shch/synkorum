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

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Note,
  Diamond,
  Line,
}

export type RectangleLayer = {
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type EllipseLayer = {
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type PathLayer = {
  type: LayerType.Path;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  points: number[][];
  value?: string;
};

export type TextLayer = {
  type: LayerType.Text;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type NoteLayer = {
  type: LayerType.Note;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type DiamondLayer = {
  type: LayerType.Diamond;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

// x/y/width/height are always a normalized, non-negative bounding box (same
// convention as every other layer) so translate/duplicate/nudge/align/group-resize
// all work on a Line with no special-casing. flipX/flipY separately record which
// corner of that box is the line's start vs. end, so the line can point in any of
// the 4 diagonal directions (not just top-left-to-bottom-right).
export type LineLayer = {
  type: LayerType.Line;
  x: number;
  y: number;
  width: number;
  height: number;
  flipX: boolean;
  flipY: boolean;
  fill: Color;
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
