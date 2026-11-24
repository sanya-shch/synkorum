import { describe, it, expect } from "vitest";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { afterLayersMoved, healBoundLines, rerouteBoundLines } from "@/lib/canvas/connectors-live";
import { getLineEndpoints } from "@/lib/canvas/line";
import { LayerType, type Layer, type LineLayer } from "@/types/canvas";

const black = { r: 0, g: 0, b: 0 };

const box = (x: number, y: number): Layer => ({
  type: LayerType.Rectangle,
  x,
  y,
  width: 100,
  height: 60,
  fill: black,
});

// a (0,0) --- b (300,0), joined by a connector from a's right magnet to b's left magnet.
const board = () => {
  const connector: LineLayer = {
    type: LayerType.Line,
    x: 100,
    y: 30,
    width: 200,
    height: 0,
    flipX: false,
    flipY: false,
    fill: black,
    arrow: true,
    startBinding: { layerId: "a", anchor: "right" },
    endBinding: { layerId: "b", anchor: "left" },
  };

  return new LiveMap<string, LiveObject<Layer>>([
    ["a", new LiveObject(box(0, 0))],
    ["b", new LiveObject(box(300, 0))],
    ["c", new LiveObject(connector)],
  ]);
};

const connectorEnds = (layers: LiveMap<string, LiveObject<Layer>>) =>
  getLineEndpoints(layers.get("c")!.toJSON() as LineLayer);

describe("rerouteBoundLines", () => {
  it("drags the connector's end along when a shape moves", () => {
    const layers = board();
    layers.get("b")!.update({ x: 400, y: 100 });

    rerouteBoundLines(layers, new Set(["b"]));

    expect(connectorEnds(layers)).toEqual({ start: { x: 100, y: 30 }, end: { x: 400, y: 130 } });
  });

  it("leaves lines that are not attached to any of the moved shapes alone", () => {
    const layers = board();
    layers.get("b")!.update({ x: 400 });
    const before = layers.get("c")!.toJSON();

    rerouteBoundLines(layers, new Set(["unrelated-shape"]));

    expect(layers.get("c")!.toJSON()).toEqual(before);
  });
});

describe("afterLayersMoved", () => {
  it("a line dragged on its own comes loose and becomes a plain line", () => {
    const layers = board();
    layers.get("c")!.update({ x: 100, y: 200 });

    afterLayersMoved(layers, ["c"]);

    expect(layers.get("c")!.toJSON()).toMatchObject({
      startBinding: null,
      endBinding: null,
      arrow: false,
      y: 200,
    });
  });

  it("a line moved together with both its shapes stays attached", () => {
    const layers = board();
    for (const id of ["a", "b", "c"]) {
      const live = layers.get(id)!;
      live.update({ x: live.get("x") + 50, y: live.get("y") + 70 });
    }

    afterLayersMoved(layers, ["a", "b", "c"]);

    expect(layers.get("c")!.toJSON()).toMatchObject({
      startBinding: { layerId: "a", anchor: "right" },
      endBinding: { layerId: "b", anchor: "left" },
      arrow: true,
    });
    expect(connectorEnds(layers)).toEqual({ start: { x: 150, y: 100 }, end: { x: 350, y: 100 } });
  });

  it("moving only one shape leaves the other end of the connector where it was", () => {
    const layers = board();
    layers.get("a")!.update({ y: 100 });

    afterLayersMoved(layers, ["a"]);

    expect(connectorEnds(layers)).toEqual({ start: { x: 100, y: 130 }, end: { x: 300, y: 30 } });
  });
});

describe("healBoundLines", () => {
  it("frees the connector when its shape was deleted, keeping it in place", () => {
    const layers = board();
    layers.delete("b");

    healBoundLines(layers);

    expect(layers.get("c")!.toJSON()).toMatchObject({
      startBinding: { layerId: "a", anchor: "right" },
      endBinding: null,
      arrow: true,
    });
    expect(connectorEnds(layers)).toEqual({ start: { x: 100, y: 30 }, end: { x: 300, y: 30 } });
  });

  it("turns a connector into a plain line when both of its shapes are gone", () => {
    const layers = board();
    layers.delete("a");
    layers.delete("b");

    healBoundLines(layers);

    expect(layers.get("c")!.toJSON()).toMatchObject({
      arrow: false,
      startBinding: null,
      endBinding: null,
    });
  });
});
