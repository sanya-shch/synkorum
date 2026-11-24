import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { Line } from "@/app/board/[boardId]/_components/line";
import { LayerType, type LineLayer } from "@/types/canvas";

const base: LineLayer = {
  type: LayerType.Line,
  x: 10,
  y: 20,
  width: 200,
  height: 0,
  flipX: false,
  flipY: false,
  fill: { r: 0, g: 0, b: 0 },
};

const render = (layer: LineLayer) =>
  renderToStaticMarkup(createElement(Line, { id: "l1", layer, onPointerDown: () => {} }));

describe("Line", () => {
  it("draws a plain line, no arrowhead, when the line is explicitly not an arrow", () => {
    const html = render({ ...base, arrow: false });

    expect(html).not.toContain("<polygon");
    // Visible stroke runs the full length.
    expect(html).toContain('x2="200"');
  });

  it("draws an arrowhead when the line is an arrow, and stops the stroke short of its tip", () => {
    const html = render({
      ...base,
      arrow: true,
      endBinding: { layerId: "b", anchor: "left" },
    });

    expect(html).toContain("<polygon");
    // The thick stroke ends inside the arrowhead (200 - 0.8 * 12 = 190.4), not at the tip (200).
    expect(html).toContain('x2="190.4"');
  });

  it("keeps the arrowhead of lines saved before the arrow field existed", () => {
    expect(render(base)).toContain("<polygon");
  });

  it("does not draw an arrowhead for a zero-length line", () => {
    expect(render({ ...base, width: 0, height: 0 })).not.toContain("<polygon");
  });
});
