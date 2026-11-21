"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBoard } from "@/actions/board";
import { isActionError } from "@/lib/action-result";

export const useCreateBoard = (organizationId: string) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const result = await createBoard({ organizationId, title: "Untitled" });

      if (isActionError(result)) {
        toast.error(result.error);
        return;
      }

      router.push(`/board/${result.board.id}`);
    });
  };

  return { create, isPending };
};
