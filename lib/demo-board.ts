import type { PlainLsonObject } from "@liveblocks/client";
import { Color, Layer, LayerType } from "@/types/canvas";

type PlainLson = PlainLsonObject["data"][string];

// The board every new demo visitor starts with. It is written straight into the Liveblocks
// room in the same shape the editor itself produces (see types/canvas.ts), so everything on
// it can be moved, edited, recolored and deleted like any other layer.

const PINK: Color = { r: 249, g: 194, b: 208 };
const YELLOW: Color = { r: 246, g: 230, b: 165 };
const GREEN: Color = { r: 185, g: 229, b: 160 };
const BLUE: Color = { r: 196, g: 226, b: 243 };
const BLACK: Color = { r: 0, g: 0, b: 0 };

const note = (x: number, y: number, fill: Color, value: string): Layer => ({
  type: LayerType.Note,
  x,
  y,
  width: 210,
  height: 190,
  fill,
  value,
});

const shape = (
  type: LayerType.Rectangle | LayerType.Ellipse | LayerType.Diamond,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: Color,
  value: string,
): Layer => ({ type, x, y, width, height, fill, value });

const arrow = (x: number, y: number, width: number): Layer => ({
  type: LayerType.Line,
  x,
  y,
  width,
  height: 0,
  flipX: false,
  flipY: false,
  fill: BLACK,
});

// Listed back to front: later entries are drawn on top of earlier ones.
const DEMO_LAYERS: Layer[] = [
  {
    type: LayerType.Text,
    x: 60,
    y: 40,
    width: 560,
    height: 60,
    fill: BLACK,
    value: "Welcome to Synkorum",
  },
  note(60, 130, YELLOW, "Drag me around. Double-click a note to edit its text."),
  note(300, 130, PINK, "Use the toolbar at the bottom: shapes, notes, pencil, arrows."),
  note(
    540,
    130,
    GREEN,
    "Collaborate live: open Share, copy the anonymous share link and paste it into another browser or device.",
  ),
  note(
    780,
    130,
    BLUE,
    "This is a demo session: 3 boards, 100 shapes per board, and it expires after 24 hours.",
  ),
  shape(LayerType.Rectangle, 60, 410, 190, 90, BLUE, "Idea"),
  arrow(250, 455, 80),
  shape(LayerType.Diamond, 330, 385, 200, 140, YELLOW, "Works?"),
  arrow(530, 455, 90),
  shape(LayerType.Ellipse, 620, 410, 190, 90, GREEN, "Ship it"),
];

export function buildDemoBoardStorage(): PlainLsonObject {
  const ids = DEMO_LAYERS.map((_, index) => `demo-${index + 1}`);

  const layers: Record<string, PlainLson> = {};
  DEMO_LAYERS.forEach((layer, index) => {
    layers[ids[index]] = { liveblocksType: "LiveObject", data: { ...layer } };
  });

  return {
    liveblocksType: "LiveObject",
    data: {
      layers: { liveblocksType: "LiveMap", data: layers },
      layerIds: { liveblocksType: "LiveList", data: ids },
    },
  };
}
