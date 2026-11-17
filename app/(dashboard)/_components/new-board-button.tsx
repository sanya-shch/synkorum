"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCreateBoard } from "@/hooks/use-create-board";

interface NewBoardButtonProps {
  organizationId: string;
}

export const NewBoardButton = ({ organizationId }: NewBoardButtonProps) => {
  const { create, isPending } = useCreateBoard(organizationId);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={create}
      className={cn(
        "flex min-h-[112px] w-full cursor-pointer items-center gap-x-4 rounded-2xl border border-dashed border-primary/50 bg-lavender/70 p-5 text-left transition hover:bg-lavender sm:h-full sm:min-h-[220px] sm:flex-col sm:items-start sm:justify-center sm:gap-y-5 sm:p-7",
        isPending && "cursor-not-allowed opacity-70",
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
        <Plus className="size-6" />
      </span>

      <span>
        <span className="block text-lg font-semibold tracking-tight">Create a new board</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          Start with a blank canvas and shape your team&apos;s next idea.
        </span>
      </span>
    </button>
  );
};
