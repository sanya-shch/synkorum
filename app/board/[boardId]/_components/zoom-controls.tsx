"use client";

import { Minus, Plus } from "lucide-react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { MIN_ZOOM, MAX_ZOOM } from "@/lib/utils";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-[72px] right-3 z-10 flex select-none items-center gap-x-1 rounded-2xl border bg-white p-1.5 shadow-lg shadow-black/5 md:bottom-4 md:right-4">
      <Hint label="Zoom out" side="top" sideOffset={14}>
        <Button
          variant="board"
          size="icon"
          aria-label="Zoom out"
          className="size-9 cursor-pointer rounded-xl"
          onClick={onZoomOut}
          disabled={zoom <= MIN_ZOOM}
        >
          <Minus />
        </Button>
      </Hint>

      <Hint label="Reset zoom to 100%" side="top" sideOffset={14}>
        <button
          onClick={onReset}
          className="w-12 cursor-pointer text-center text-sm font-medium text-slate-700 hover:text-primary"
        >
          {Math.round(zoom * 100)}%
        </button>
      </Hint>

      <Hint label="Zoom in" side="top" sideOffset={14}>
        <Button
          variant="board"
          size="icon"
          aria-label="Zoom in"
          className="size-9 cursor-pointer rounded-xl"
          onClick={onZoomIn}
          disabled={zoom >= MAX_ZOOM}
        >
          <Plus />
        </Button>
      </Hint>
    </div>
  );
};
