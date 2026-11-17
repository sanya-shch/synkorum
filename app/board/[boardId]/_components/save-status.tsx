"use client";

import { cn } from "@/lib/utils";
import { SAVE_STATE_LABEL, useSaveState, type SaveState } from "@/hooks/use-save-state";

const DOT: Record<SaveState, string> = {
  saved: "bg-emerald-500",
  saving: "bg-amber-400 animate-pulse",
  reconnecting: "bg-amber-400 animate-pulse",
  offline: "bg-red-500",
};

// Small "Saved" caption shown under the board title in the header.
export const SaveStatus = ({ className }: { className?: string }) => {
  const state = useSaveState();

  return (
    <span
      role="status"
      className={cn("flex items-center gap-x-1.5 text-xs text-muted-foreground", className)}
    >
      <span className={cn("size-1.5 rounded-full", DOT[state])} />
      {SAVE_STATE_LABEL[state].short}
    </span>
  );
};

// "All changes saved" pill in the bottom-left corner of the canvas.
export const SavePill = () => {
  const state = useSaveState();

  return (
    <div
      role="status"
      className="absolute bottom-4 left-4 z-10 hidden h-10 items-center gap-x-2 rounded-xl border bg-white px-3.5 text-sm text-muted-foreground shadow-lg shadow-black/5 md:flex"
    >
      <span className={cn("size-2 rounded-full", DOT[state])} />
      {SAVE_STATE_LABEL[state].long}
    </div>
  );
};
