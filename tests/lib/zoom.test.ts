import { describe, it, expect } from "vitest";
import { zoomAroundPoint, MIN_ZOOM, MAX_ZOOM } from "@/lib/canvas/camera";
import type { Camera } from "@/types/canvas";

const identity: Camera = { x: 0, y: 0, zoom: 1 };

describe("zoomAroundPoint", () => {
  it("keeps the world point under the cursor fixed on screen after zooming in", () => {
    const camera: Camera = { x: 100, y: 50, zoom: 1 };
    const cursor = { x: 300, y: 200 };
    const worldXBefore = (cursor.x - camera.x) / camera.zoom;
    const worldYBefore = (cursor.y - camera.y) / camera.zoom;

    const next = zoomAroundPoint(camera, cursor, 2);

    const worldXAfter = (cursor.x - next.x) / next.zoom;
    const worldYAfter = (cursor.y - next.y) / next.zoom;
    expect(worldXAfter).toBeCloseTo(worldXBefore);
    expect(worldYAfter).toBeCloseTo(worldYBefore);
  });

  it("doubles the zoom for a factor of 2 from identity", () => {
    const next = zoomAroundPoint(identity, { x: 0, y: 0 }, 2);
    expect(next.zoom).toBe(2);
  });

  it("halves the zoom for a factor of 0.5", () => {
    const next = zoomAroundPoint(identity, { x: 0, y: 0 }, 0.5);
    expect(next.zoom).toBe(0.5);
  });

  it("zooming around (0,0) from identity leaves the camera at the origin", () => {
    const next = zoomAroundPoint(identity, { x: 0, y: 0 }, 3);
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });

  it("clamps to MAX_ZOOM instead of zooming in indefinitely", () => {
    const next = zoomAroundPoint({ x: 0, y: 0, zoom: MAX_ZOOM }, { x: 10, y: 10 }, 10);
    expect(next.zoom).toBe(MAX_ZOOM);
  });

  it("clamps to MIN_ZOOM instead of zooming out indefinitely", () => {
    const next = zoomAroundPoint({ x: 0, y: 0, zoom: MIN_ZOOM }, { x: 10, y: 10 }, 0.01);
    expect(next.zoom).toBe(MIN_ZOOM);
  });

  it("a factor of 1 leaves zoom and camera position unchanged", () => {
    const camera: Camera = { x: 42, y: -17, zoom: 1.5 };
    expect(zoomAroundPoint(camera, { x: 123, y: 456 }, 1)).toEqual(camera);
  });
});

describe("pointerEventToCanvasPoint (zoom-aware)", () => {
  it("accounts for zoom when converting a screen point to a world point", async () => {
    const { pointerEventToCanvasPoint } = await import("@/lib/canvas/camera");
    const camera: Camera = { x: 100, y: 50, zoom: 2 };
    const point = pointerEventToCanvasPoint(
      { clientX: 300, clientY: 250 } as unknown as React.PointerEvent,
      camera,
    );
    // (300-100)/2 = 100, (250-50)/2 = 100
    expect(point).toEqual({ x: 100, y: 100 });
  });
});
