import { describe, it, expect } from "vitest";
import { buildDemoBoardStorage } from "@/lib/demo-board";
import { computeLineRoute } from "@/lib/canvas/connectors";
import { LayerType, type Layer, type LineLayer } from "@/types/canvas";

type Plain = { liveblocksType: "LiveObject"; data: Layer };

const seeded = () => {
  const storage = buildDemoBoardStorage();
  const raw = (storage.data.layers as { data: Record<string, Plain> }).data;
  return new Map(Object.entries(raw).map(([id, value]) => [id, value.data]));
};

describe("demo board", () => {
  it("connects its flowchart with real connectors that sit exactly on the shapes' magnets", () => {
    const layers = seeded();
    const lines = [...layers.entries()].filter(([, layer]) => layer.type === LayerType.Line);

    expect(lines).toHaveLength(2);
    for (const [, layer] of lines) {
      const line = layer as LineLayer;
      expect(line.startBinding).toBeTruthy();
      expect(line.endBinding).toBeTruthy();
      expect(line.arrow).toBe(true);
      // Nothing to re-aim: geometry and bindings already agree (and no binding dangles).
      expect(computeLineRoute(line, layers)).toBeNull();
    }
  });
});
