"use client";

import { Plus, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateBoard } from "@/hooks/use-create-board";

import { EmptyState } from "./empty-state";

interface EmptyBoardsProps {
  organizationId: string;
}

export const EmptyBoards = ({ organizationId }: EmptyBoardsProps) => {
  const { create, isPending } = useCreateBoard(organizationId);

  return (
    <EmptyState
      icon={LayoutGrid}
      title="No boards yet"
      description="Create a board for this team and start collaborating on a blank canvas."
    >
      <Button
        disabled={isPending}
        onClick={create}
        className="h-11 cursor-pointer gap-x-2 rounded-xl px-5"
      >
        <Plus className="size-4" />
        Create a board
      </Button>
    </EmptyState>
  );
};
