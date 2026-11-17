"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createBoardShareLink } from "@/actions/invite";

// Copy-link actions shared by the board card menu, the board header menu and the Share menu.
export const useBoardLinks = (boardId: string) => {
  const [pending, startTransition] = useTransition();

  const onCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/board/${boardId}`)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const onCopyShareLink = (canEdit: boolean) => {
    startTransition(async () => {
      const result = await createBoardShareLink({ boardId, canEdit });

      if ("error" in result || !("shareUrl" in result)) {
        toast.error(result?.error ?? "Failed to create share link");
        return;
      }

      await navigator.clipboard
        .writeText(result.shareUrl)
        .then(() =>
          toast.success(canEdit ? "Anonymous share link copied" : "Read-only share link copied"),
        )
        .catch(() => toast.error("Failed to copy link"));
    });
  };

  return { pending, onCopyLink, onCopyShareLink };
};
