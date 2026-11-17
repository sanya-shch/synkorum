"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateBoard } from "@/hooks/use-create-board";

export const CreateBoardButton = ({ organizationId }: { organizationId: string }) => {
  const { create, isPending } = useCreateBoard(organizationId);

  return (
    <Button
      onClick={create}
      disabled={isPending}
      aria-label="Create a board"
      className="h-12 shrink-0 cursor-pointer gap-x-2 rounded-xl px-4 text-[15px] shadow-md shadow-primary/25 sm:px-6"
    >
      <Plus className="size-5" />
      <span className="hidden sm:inline">Create a board</span>
    </Button>
  );
};
