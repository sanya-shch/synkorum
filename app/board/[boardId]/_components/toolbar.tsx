import {
  ArrowUpRight,
  Circle,
  Diamond as DiamondIcon,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
} from "lucide-react";

import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";

import { ToolButton } from "./tool-button";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  readOnly?: boolean;
}

export const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  readOnly,
}: ToolbarProps) => {
  const isInserting = (layerType: LayerType) =>
    canvasState.mode === CanvasMode.Inserting && canvasState.layerType === layerType;

  const insert =
    (
      layerType:
        | LayerType.Note
        | LayerType.Text
        | LayerType.Rectangle
        | LayerType.Ellipse
        | LayerType.Diamond
        | LayerType.Line,
    ) =>
    () =>
      setCanvasState({ mode: CanvasMode.Inserting, layerType });

  return (
    // Desktop: a floating column under the header. Phones: one row along the bottom edge.
    <div className="absolute inset-x-3 bottom-3 z-10 flex items-stretch gap-x-2 md:inset-x-auto md:bottom-auto md:left-4 md:top-24 md:flex-col md:gap-y-3">
      <div
        className={cardClass + " min-w-0 flex-1 overflow-x-auto md:flex-none md:overflow-visible"}
      >
        <ToolButton
          label="Select"
          icon={MousePointer2}
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing
          }
        />

        {!readOnly && (
          <>
            <Divider />

            <ToolButton
              label="Rectangle"
              icon={Square}
              onClick={insert(LayerType.Rectangle)}
              isActive={isInserting(LayerType.Rectangle)}
            />
            <ToolButton
              label="Ellipse"
              icon={Circle}
              onClick={insert(LayerType.Ellipse)}
              isActive={isInserting(LayerType.Ellipse)}
            />
            <ToolButton
              label="Diamond"
              icon={DiamondIcon}
              onClick={insert(LayerType.Diamond)}
              isActive={isInserting(LayerType.Diamond)}
            />
            <ToolButton
              label="Line"
              icon={ArrowUpRight}
              onClick={insert(LayerType.Line)}
              isActive={isInserting(LayerType.Line)}
            />

            <Divider />

            <ToolButton
              label="Text"
              icon={Type}
              onClick={insert(LayerType.Text)}
              isActive={isInserting(LayerType.Text)}
            />
            <ToolButton
              label="Sticky note"
              icon={StickyNote}
              onClick={insert(LayerType.Note)}
              isActive={isInserting(LayerType.Note)}
            />
            <ToolButton
              label="Pen"
              icon={Pencil}
              onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
              isActive={canvasState.mode === CanvasMode.Pencil}
            />
          </>
        )}
      </div>

      {!readOnly && (
        <div className={cardClass + " shrink-0"}>
          <ToolButton label="Undo" icon={Undo2} onClick={undo} isDisabled={!canUndo} />
          <ToolButton label="Redo" icon={Redo2} onClick={redo} isDisabled={!canRedo} />
        </div>
      )}
    </div>
  );
};

const cardClass =
  "flex items-center gap-x-1 rounded-2xl border bg-white p-1.5 shadow-lg shadow-black/5 md:flex-col md:gap-x-0 md:gap-y-1";

const Divider = () => (
  <div className="mx-1 h-6 w-px shrink-0 bg-border md:mx-0 md:my-1 md:h-px md:w-6" />
);

export const ToolbarSkeleton = () => {
  return (
    <div className="absolute left-4 top-24 z-10 hidden h-[360px] w-[54px] rounded-2xl border bg-white shadow-lg shadow-black/5 md:block" />
  );
};
