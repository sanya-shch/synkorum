import { describe, it, expect } from "vitest";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { liveLayersToMap, findIntersectingLayersWithRectangle } from "@/lib/canvas/layers";
import { LayerType, type Layer } from "@/types/canvas";

const rect = (x: number, y: number): Layer => ({
  type: LayerType.Rectangle,
  x,
  y,
  width: 10,
  height: 10,
  fill: { r: 0, g: 0, b: 0 },
});

describe("liveLayersToMap", () => {
  it("does NOT silently return an empty map (regression for the Object.entries bug)", () => {
    const liveLayers = new LiveMap<string, LiveObject<Layer>>([
      ["a", new LiveObject(rect(0, 0))],
      ["b", new LiveObject(rect(50, 50))],
    ]);

    const map = liveLayersToMap(liveLayers);

    expect(map.size).toBe(2);
  });

  it("unwraps each LiveObject to a plain Layer with real x/y/width/height", () => {
    const liveLayers = new LiveMap<string, LiveObject<Layer>>([["a", new LiveObject(rect(5, 7))]]);

    const layer = liveLayersToMap(liveLayers).get("a");

    expect(layer).toMatchObject({ x: 5, y: 7, width: 10, height: 10 });
  });

  it("reflects live edits made through the LiveObject, not a stale snapshot", () => {
    const live = new LiveObject(rect(0, 0));
    const liveLayers = new LiveMap<string, LiveObject<Layer>>([["a", live]]);

    live.update({ x: 99 });

    expect(liveLayersToMap(liveLayers).get("a")?.x).toBe(99);
  });
});

describe("drag-select end to end (LiveMap -> intersecting ids)", () => {
  it("selects layers inside the drag rectangle and excludes layers outside it", () => {
    const liveLayers = new LiveMap<string, LiveObject<Layer>>([
      ["inside", new LiveObject(rect(10, 10))],
      ["outside", new LiveObject(rect(500, 500))],
    ]);
    const layerIds = ["inside", "outside"];

    const layersMap = liveLayersToMap(liveLayers);
    const ids = findIntersectingLayersWithRectangle(
      layerIds,
      layersMap,
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    );

    expect(ids).toEqual(["inside"]);
  });
});
