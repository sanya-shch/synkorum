"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { nanoid } from "nanoid";

import {
  useHistory,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStorage,
  useOthersMapped,
  useSelf,
} from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { connectionIdToColor, colorToCss } from "@/lib/canvas/color";
import { pointerEventToCanvasPoint, zoomAroundPoint } from "@/lib/canvas/camera";
import {
  resizeBounds,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  liveLayersToMap,
} from "@/lib/canvas/layers";
import { isTypingTarget } from "@/lib/canvas/input";
import { nudge, type LayerBounds } from "@/lib/canvas/alignment";
import { resizeGroup } from "@/lib/canvas/resize-group";
import { getLineEndpoints, getLineLength, moveLineEndpoint } from "@/lib/canvas/line";
import {
  arrowPatch,
  constrainAngle,
  DEFAULT_LINE_LENGTH,
  findSnapTarget,
  MIN_LINE_LENGTH,
  SNAP_RADIUS_PX,
} from "@/lib/canvas/connectors";
import { afterLayersMoved, insertLine } from "@/lib/canvas/connectors-live";
import { MAX_LAYERS } from "@/lib/constants";
import { notifyLayerLimit } from "@/lib/layer-limit";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Anchor,
  Color,
  LayerType,
  LineLayer,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useDuplicateLayers } from "@/hooks/use-duplicate-layers";

import { Info } from "./info";
import { Toolbar } from "./toolbar";
import { SavePill } from "./save-status";
import { CursorsPresence } from "./cursors-presence";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { ZoomControls } from "./zoom-controls";
import { Path } from "./path";

interface CanvasProps {
  board: {
    id: string;
    title: string;
    organizationId: string;
    organizationName: string | null;
  };
  isMember: boolean;
}

// Dot grid that pans and zooms with the camera. Spacing doubles when zoomed far out so
// the dots never turn into a solid wash.
const gridStep = (zoom: number) => {
  let step = 24 * zoom;
  while (step < 14) step *= 2;
  return step;
};

export const Canvas = ({ board, isMember }: CanvasProps) => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });
  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  // Liveblocks rejects Storage writes server-side for a READ_ACCESS token regardless
  // of what the UI does, but hiding the editing affordances avoids "I clicked it and
  // nothing happened" for read-only share-link guests.
  const readOnly = useSelf((me) => me.canWrite) === false;

  useDisableScrollBounce();

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const layerIds = useStorage((root) => root.layerIds);

  const insertLayer = useMutation(
    (
      { storage, setMyPresence, self },
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Diamond
        | LayerType.Line,
      position: Point,
    ) => {
      if (!self.canWrite) return;

      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        notifyLayerLimit();
        return;
      }

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject(
        layerType === LayerType.Line
          ? {
              type: layerType,
              x: position.x,
              y: position.y,
              height: 0,
              width: DEFAULT_LINE_LENGTH,
              flipX: false,
              flipY: false,
              fill: lastUsedColor,
              arrow: false,
            }
          : {
              type: layerType,
              x: position.x,
              y: position.y,
              height: 100,
              width: 100,
              fill: lastUsedColor,
            },
      );

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [lastUsedColor],
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating || !self.canWrite) {
        return;
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      // Lines attached to what moved follow it; a line moved without its shapes comes loose.
      afterLayersMoved(liveLayers, self.presence.selection);

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers");

      const layersMap = liveLayersToMap(layers);

      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });

      const ids = findIntersectingLayersWithRectangle(layerIds!, layersMap, origin, current);

      setMyPresence({ selection: ids });
    },
    [layerIds],
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (canvasState.mode !== CanvasMode.Pencil || e.buttons !== 1 || pencilDraft == null) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 && pencilDraft[0][0] === point.x && pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode],
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const { pencilDraft } = self.presence;

      if (!self.canWrite || pencilDraft == null || pencilDraft.length < 2) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      if (storage.get("layers").size >= MAX_LAYERS) {
        notifyLayerLimit();
        setMyPresence({ pencilDraft: null });
        return;
      }

      const liveLayers = storage.get("layers");
      const id = nanoid();
      liveLayers.set(id, new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor)));

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);

      setMyPresence({ pencilDraft: null });
      setCanvasState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor],
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
      });
    },
    [lastUsedColor],
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point, lockAspect: boolean) => {
      if (canvasState.mode !== CanvasMode.Resizing || !self.canWrite) {
        return;
      }

      const newGroupBounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point,
        lockAspect,
      );

      const patch = resizeGroup(
        canvasState.initialBounds,
        canvasState.initialLayerBounds,
        newGroupBounds,
      );

      const liveLayers = storage.get("layers");
      for (const [id, bounds] of Object.entries(patch)) {
        liveLayers.get(id)?.update(bounds);
      }

      afterLayersMoved(liveLayers, Object.keys(patch));
    },
    [canvasState],
  );

  const onResizeHandlePointerDown = useMutation(
    ({ storage, self }, corner: Side, initialBounds: XYWH) => {
      if (!self.canWrite) return;

      // Capture every selected layer's bounds once, at the start of the drag - the
      // whole resize scales from these fixed originals, not from intermediate,
      // already-scaled bounds (which would drift/compound frame to frame).
      const liveLayers = storage.get("layers");
      const initialLayerBounds: Record<string, XYWH> = {};
      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);
        if (!layer) continue;
        initialLayerBounds[id] = {
          x: layer.get("x"),
          y: layer.get("y"),
          width: layer.get("width"),
          height: layer.get("height"),
        };
      }

      history.pause();
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        initialLayerBounds,
        corner,
      });
    },
    [history],
  );

  const onLineEndpointPointerDown = useCallback(
    (layerId: string, which: "start" | "end") => {
      history.pause();
      setCanvasState({ mode: CanvasMode.ResizingLine, layerId, which });
    },
    [history],
  );

  const resizeLineEndpoint = useMutation(
    ({ storage, self }, point: Point, modifiers: { shift: boolean; alt: boolean }) => {
      if (canvasState.mode !== CanvasMode.ResizingLine || !self.canWrite) return;

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(canvasState.layerId);
      if (!layer) return;

      // .get() on a LiveObject<Layer> only exposes fields common to every layer type
      // (keyof of a union is the intersection of its members' keys), so read the
      // Line-only fields via a plain, type-guard-narrowable snapshot instead.
      const data = layer.toJSON();
      if (data.type !== LayerType.Line) return;

      const { which } = canvasState;
      const bindingKey = which === "start" ? "startBinding" : "endBinding";
      const otherBinding = which === "start" ? data.endBinding : data.startBinding;

      // Snap to a shape's magnet unless Alt is held. A line is never attached to the same
      // shape at both ends.
      const target = modifiers.alt
        ? null
        : findSnapTarget(point, storage.get("layerIds").toJSON(), liveLayersToMap(liveLayers), {
            radius: SNAP_RADIUS_PX / camera.zoom,
            excludeIds: [canvasState.layerId, ...(otherBinding ? [otherBinding.layerId] : [])],
          });

      // Without a magnet, Shift locks the direction to multiples of 45 degrees.
      const { start, end } = getLineEndpoints(data);
      const fixed = which === "start" ? end : start;
      const position = target
        ? target.point
        : modifiers.shift
          ? constrainAngle(fixed, point)
          : point;

      const binding = target ? { layerId: target.layerId, anchor: target.anchor } : null;
      const patch: Partial<LineLayer> = {
        ...moveLineEndpoint(data, which, position),
        [bindingKey]: binding,
        ...arrowPatch(data, { ...data, [bindingKey]: binding }),
      };

      layer.update(patch);
    },
    [canvasState, camera.zoom],
  );

  // Starts a new line at `origin` and hands the drag over to resizeLineEndpoint, so the
  // new line's end follows the pointer (and snaps) exactly like an existing line's handle.
  const startNewLine = useMutation(
    (
      { storage, self, setMyPresence },
      layerId: string,
      origin: Point,
      startBinding: { layerId: string; anchor: Anchor } | null,
    ) => {
      if (!self.canWrite) return false;

      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        notifyLayerLimit();
        return false;
      }

      insertLine(liveLayers, storage.get("layerIds"), layerId, origin, lastUsedColor, startBinding);
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      return true;
    },
    [lastUsedColor],
  );

  // Pressing one of the dots next to a selected shape drags a new line out of that side.
  const onConnectorPointerDown = useCallback(
    (shapeId: string, anchor: Anchor, origin: Point) => {
      // Paused first, so creating the line and dragging it out is a single undo step.
      history.pause();
      const layerId = nanoid();

      if (!startNewLine(layerId, origin, { layerId: shapeId, anchor })) {
        history.resume();
        return;
      }

      setCanvasState({ mode: CanvasMode.ResizingLine, layerId, which: "end", created: "magnet" });
    },
    [history, startNewLine],
  );

  // With the line tool: press where the line should start (snapping to a nearby magnet),
  // drag, release where it should end.
  const findLineStart = useMutation(
    ({ storage }, point: Point) => {
      const liveLayers = storage.get("layers");
      const target = findSnapTarget(
        point,
        storage.get("layerIds").toJSON(),
        liveLayersToMap(liveLayers),
        { radius: SNAP_RADIUS_PX / camera.zoom },
      );

      return {
        origin: target ? target.point : point,
        binding: target ? { layerId: target.layerId, anchor: target.anchor } : null,
      };
    },
    [camera.zoom],
  );

  // A line that was just dragged out and is (almost) zero length was a click: with the line
  // tool that means "give me a default line", from a magnet it means "never mind".
  const finishNewLine = useMutation(
    ({ storage, setMyPresence }, layerId: string, created: "magnet" | "tool") => {
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(layerId);
      if (!layer) return;

      const data = layer.toJSON();
      if (data.type !== LayerType.Line || getLineLength(data) >= MIN_LINE_LENGTH) return;

      if (created === "tool" && !data.startBinding) {
        layer.update({ width: DEFAULT_LINE_LENGTH, height: 0, flipX: false, flipY: false });
        return;
      }

      liveLayers.delete(layerId);
      const liveLayerIds = storage.get("layerIds");
      const index = liveLayerIds.indexOf(layerId);
      if (index !== -1) liveLayerIds.delete(index);
      setMyPresence({ selection: [] }, { addToHistory: true });
    },
    [],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Trackpad pinch-zoom and Ctrl/Cmd+scroll are both reported as wheel events with
    // ctrlKey set (that's how browsers signal pinch gestures on a trackpad too).
    // Plain two-finger scroll (no ctrlKey) pans instead.
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // deltaY is negative when scrolling/pinching "up" (zoom in). exp() gives a
      // smooth, multiplicative zoom curve that feels the same at any zoom level.
      const zoomFactor = Math.exp(-e.deltaY * 0.01);
      setCamera((camera) => zoomAroundPoint(camera, { x: e.clientX, y: e.clientY }, zoomFactor));
      return;
    }

    setCamera((camera) => ({
      ...camera,
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  // Zoom-in/out buttons and keyboard shortcuts have no cursor position to anchor to,
  // so they zoom around the viewport's center instead.
  const zoomByButtonOrShortcut = useCallback((zoomFactor: number) => {
    setCamera((camera) =>
      zoomAroundPoint(camera, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, zoomFactor),
    );
  }, []);

  const zoomIn = useCallback(() => zoomByButtonOrShortcut(1.2), [zoomByButtonOrShortcut]);
  const zoomOut = useCallback(() => zoomByButtonOrShortcut(1 / 1.2), [zoomByButtonOrShortcut]);
  const resetZoom = useCallback(() => setCamera((camera) => ({ ...camera, zoom: 1 })), []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        // Hold Shift while dragging a corner handle to keep the shape's aspect ratio
        // (a square stays a square, a circle stays a circle instead of becoming an oval).
        resizeSelectedLayer(current, e.shiftKey);
      } else if (canvasState.mode === CanvasMode.ResizingLine) {
        resizeLineEndpoint(current, { shift: e.shiftKey, alt: e.altKey });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [
      camera,
      canvasState,
      resizeSelectedLayer,
      resizeLineEndpoint,
      translateSelectedLayers,
      startMultiSelection,
      updateSelectionNet,
      continueDrawing,
    ],
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Inserting) {
        // The line tool draws by dragging (press = start, release = end); every other
        // shape is placed on release (see onPointerUp).
        if (canvasState.layerType === LayerType.Line) {
          const { origin, binding } = findLineStart(point);
          history.pause();
          const layerId = nanoid();

          if (startNewLine(layerId, origin, binding)) {
            setCanvasState({
              mode: CanvasMode.ResizingLine,
              layerId,
              which: "end",
              created: "tool",
            });
          } else {
            history.resume();
          }
        }
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState, setCanvasState, startDrawing, findLineStart, startNewLine, history],
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
        unselectLayers();
        setCanvasState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else if (canvasState.mode === CanvasMode.ResizingLine && canvasState.created) {
        finishNewLine(canvasState.layerId, canvasState.created);
        setCanvasState({ mode: CanvasMode.None });
      } else {
        setCanvasState({
          mode: CanvasMode.None,
        });
      }

      history.resume();
    },
    [
      camera,
      canvasState,
      history,
      insertLayer,
      unselectLayers,
      insertPath,
      finishNewLine,
      setCanvasState,
    ],
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      e.stopPropagation();

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      // Read-only guests can select a layer to look at it, but there is nothing to
      // drag: don't pause history or enter Translating for a move that would be
      // rejected server-side anyway.
      if (!self.canWrite) return;

      history.pause();
      const point = pointerEventToCanvasPoint(e, camera);
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, history, canvasState.mode],
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();
  const duplicateLayers = useDuplicateLayers();

  const nudgeSelectedLayers = useMutation(({ storage, self }, dx: number, dy: number) => {
    if (!self.canWrite || self.presence.selection.length === 0) return;

    const liveLayers = storage.get("layers");
    const bounds: LayerBounds = {};
    for (const id of self.presence.selection) {
      const layer = liveLayers.get(id);
      if (!layer) continue;
      bounds[id] = {
        x: layer.get("x"),
        y: layer.get("y"),
        width: layer.get("width"),
        height: layer.get("height"),
      };
    }

    const patch = nudge(bounds, dx, dy);
    for (const [id, delta] of Object.entries(patch)) {
      liveLayers.get(id)?.update(delta);
    }

    afterLayersMoved(liveLayers, Object.keys(patch));
  }, []);

  useEffect(() => {
    // Arrow-key repeats fire one keydown per tick while held; pausing history on the
    // first (non-repeat) press and resuming on keyup coalesces the whole hold into a
    // single undo step, the same way a mouse-drag nudge would.
    let isNudging = false;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault(); // browser default is "bookmark this page"
        if (!readOnly) duplicateLayers();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault(); // browser default is "zoom the whole page"
          zoomIn();
          return;
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomOut();
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          resetZoom();
          return;
        }
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (!readOnly) deleteLayers();
          break;
        case "Escape":
          setCanvasState({ mode: CanvasMode.None });
          unselectLayers();
          break;
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          if (readOnly) break;
          e.preventDefault(); // don't scroll the page
          if (!isNudging) {
            history.pause();
            isNudging = true;
          }
          const step = e.shiftKey ? 10 : 1;
          const deltas: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          const [dx, dy] = deltas[e.key];
          nudgeSelectedLayers(dx, dy);
          break;
        }
        case "v":
        case "V":
          setCanvasState({ mode: CanvasMode.None });
          break;
        case "r":
        case "R":
          if (!readOnly)
            setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Rectangle });
          break;
        case "o":
        case "O":
          if (!readOnly)
            setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Ellipse });
          break;
        case "d":
        case "D":
          if (!readOnly)
            setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Diamond });
          break;
        case "l":
        case "L":
          if (!readOnly) setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Line });
          break;
        case "t":
        case "T":
          if (!readOnly) setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Text });
          break;
        case "n":
        case "N":
          if (!readOnly) setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Note });
          break;
        case "p":
        case "P":
          if (!readOnly) setCanvasState({ mode: CanvasMode.Pencil });
          break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (isNudging && e.key.startsWith("Arrow")) {
        history.resume();
        isNudging = false;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [
    deleteLayers,
    duplicateLayers,
    nudgeSelectedLayers,
    zoomIn,
    zoomOut,
    resetZoom,
    history,
    readOnly,
    setCanvasState,
    unselectLayers,
  ]);

  return (
    <main
      className="relative h-full w-full touch-none overflow-hidden bg-canvas"
      style={{
        backgroundImage: "radial-gradient(circle, rgb(30 31 58 / 0.16) 1px, transparent 1.5px)",
        backgroundSize: `${gridStep(camera.zoom)}px ${gridStep(camera.zoom)}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      }}
    >
      <Info board={board} isMember={isMember} />

      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
        readOnly={readOnly}
      />

      {!readOnly && <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />}

      <ZoomControls zoom={camera.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />

      <SavePill />

      <svg
        data-testid="canvas-svg"
        className="block h-full w-full"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerDown={onPointerDown}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          }}
        >
          {layerIds?.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}

          <SelectionBox
            onResizeHandlePointerDown={onResizeHandlePointerDown}
            onLineEndpointPointerDown={onLineEndpointPointerDown}
            onConnectorPointerDown={onConnectorPointerDown}
            readOnly={readOnly}
            zoom={camera.zoom}
          />

          {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
            <rect
              className="fill-blue-500/5 stroke-blue-500 stroke-1"
              x={Math.min(canvasState.origin.x, canvasState.current.x)}
              y={Math.min(canvasState.origin.y, canvasState.current.y)}
              width={Math.abs(canvasState.origin.x - canvasState.current.x)}
              height={Math.abs(canvasState.origin.y - canvasState.current.y)}
            />
          )}

          <CursorsPresence />

          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path points={pencilDraft} fill={colorToCss(lastUsedColor)} x={0} y={0} />
          )}
        </g>
      </svg>
    </main>
  );
};
