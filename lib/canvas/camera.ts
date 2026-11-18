import type { Camera, Point } from "@/types/canvas";

export function pointerEventToCanvasPoint(e: React.PointerEvent, camera: Camera) {
  return {
    x: Math.round((e.clientX - camera.x) / camera.zoom),
    y: Math.round((e.clientY - camera.y) / camera.zoom),
  };
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

// Zooms the camera by `zoomFactor` (>1 zooms in, <1 zooms out) while keeping the
// world point currently under `screenPoint` visually fixed - the standard "zoom to
// cursor" behavior. `screenPoint` is in the same coordinate space as
// PointerEvent.clientX/clientY (the canvas fills the viewport from 0,0).
export function zoomAroundPoint(camera: Camera, screenPoint: Point, zoomFactor: number): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * zoomFactor));

  // The world point currently under the cursor, before the zoom is applied.
  const worldX = (screenPoint.x - camera.x) / camera.zoom;
  const worldY = (screenPoint.y - camera.y) / camera.zoom;

  return {
    zoom,
    x: screenPoint.x - worldX * zoom,
    y: screenPoint.y - worldY * zoom,
  };
}
