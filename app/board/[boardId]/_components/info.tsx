"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, MoreHorizontal, UserPlus } from "lucide-react";

import { Actions } from "@/components/board-actions";
import { Hint } from "@/components/hint";
import { LogoMark } from "@/components/logo";
import { ShareMenu } from "@/components/share-menu";
import { Button } from "@/components/ui/button";
import { useMembersModal } from "@/store/use-members-modal";
import { useRenameModal } from "@/store/use-rename-modal";

import { Participants } from "./participants";
import { SaveStatus } from "./save-status";

interface InfoProps {
  board: {
    id: string;
    title: string;
    organizationId: string;
    // Only set for team members; anonymous share-link guests don't get to see it.
    organizationName: string | null;
  };
  isMember: boolean;
}

// Full-width top bar: back + breadcrumbs + title on the left, collaborators and
// Invite / Share / menu on the right. Floats over the canvas (the SVG fills the screen).
export const Info = ({ board, isMember }: InfoProps) => {
  const { onOpen: openRename } = useRenameModal();
  const openMembers = useMembersModal((s) => s.onOpen);

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between gap-x-2 border-b bg-white/95 px-2 backdrop-blur sm:h-16 sm:px-4">
      <div className="flex min-w-0 items-center gap-x-2 sm:gap-x-3">
        <Hint label={isMember ? "Back to dashboard" : "Synkorum home"} side="bottom">
          <Link
            href={isMember ? "/dashboard" : "/"}
            aria-label={isMember ? "Back to dashboard" : "Synkorum home"}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-white text-slate-600 shadow-xs transition hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Hint>

        <div className="hidden h-8 w-px bg-border md:block" />

        <LogoMark className="hidden size-9 md:inline-flex" />

        {board.organizationName && (
          <nav aria-label="Breadcrumb" className="hidden items-center gap-x-2 text-sm lg:flex">
            <span className="max-w-[160px] truncate text-muted-foreground">
              {board.organizationName}
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <Link href="/dashboard?view=all" className="font-medium hover:text-primary">
              Boards
            </Link>
          </nav>
        )}

        <div className="hidden h-8 w-px bg-border lg:block" />

        <div className="min-w-0 leading-tight">
          {isMember ? (
            <button
              type="button"
              onClick={() => openRename(board.id, board.title)}
              className="block max-w-[44vw] cursor-pointer truncate text-left text-[15px] font-semibold hover:text-primary sm:max-w-[320px]"
            >
              {board.title}
            </button>
          ) : (
            <span className="block max-w-[44vw] truncate text-[15px] font-semibold sm:max-w-[320px]">
              {board.title}
            </span>
          )}

          <SaveStatus />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-x-2 sm:gap-x-3">
        <div className="hidden sm:block">
          <Participants />
        </div>

        {isMember && (
          <>
            <Button
              variant="outline"
              aria-label="Invite teammates"
              onClick={() => openMembers(board.organizationId)}
              className="hidden h-10 cursor-pointer gap-x-2 rounded-xl bg-white px-4 shadow-xs sm:inline-flex"
            >
              <UserPlus className="size-4" />
              <span className="hidden lg:inline">Invite</span>
            </Button>

            <ShareMenu boardId={board.id} />

            <Actions id={board.id} title={board.title} side="bottom" sideOffset={10}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Board menu"
                className="size-10 cursor-pointer rounded-xl bg-white shadow-xs"
              >
                <MoreHorizontal />
              </Button>
            </Actions>
          </>
        )}
      </div>
    </header>
  );
};

export const InfoSkeleton = () => {
  return <div className="absolute inset-x-0 top-0 z-20 h-14 border-b bg-white sm:h-16" />;
};
