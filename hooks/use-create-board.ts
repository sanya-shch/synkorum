"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { createBoard } from "@/actions/board";

// Boards no longer rely on a stored preview image (the dashboard draws a placeholder),
// but the column is still required by the schema.
const PLACEHOLDER_IMAGE = "file.svg";

export const useCreateBoard = (organizationId: string) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const result = await createBoard({
        organizationId,
        title: "Untitled",
        imageUrl: PLACEHOLDER_IMAGE,
      });

      if ("board" in result) {
        router.push(`/board/${result.board!.id}`);
      }
    });
  };

  return { create, isPending };
};
