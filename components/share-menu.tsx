"use client";

import { Eye, Link2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardLinks } from "@/hooks/use-board-links";

export const ShareMenu = ({ boardId }: { boardId: string }) => {
  const { pending, onCopyLink, onCopyShareLink } = useBoardLinks(boardId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Share"
            className="size-10 cursor-pointer gap-x-2 rounded-xl px-0 shadow-md shadow-primary/25 sm:w-auto sm:px-4"
          >
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
        <DropdownMenuItem onClick={onCopyLink} className="cursor-pointer rounded-lg p-3">
          <Link2 className="mr-2 size-4" />
          Copy board link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onCopyShareLink(true)}
          disabled={pending}
          className="cursor-pointer rounded-lg p-3"
        >
          <Share2 className="mr-2 size-4" />
          Copy anonymous share link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onCopyShareLink(false)}
          disabled={pending}
          className="cursor-pointer rounded-lg p-3"
        >
          <Eye className="mr-2 size-4" />
          Copy read-only share link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
