"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Star } from "lucide-react";

import { Actions } from "@/components/board-actions";
import { toggleFavorite } from "@/actions/board";
import { cn } from "@/lib/utils";

import { BoardThumbnail } from "./board-thumbnail";

interface BoardCardProps {
  id: string;
  title: string;
  authorName: string;
  createdAt: Date;
  isFavorite: boolean;
}

export const BoardCard = ({ id, title, authorName, createdAt, isFavorite }: BoardCardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createdAtLabel = formatDistanceToNow(createdAt, { addSuffix: true });

  const onFavorite = () => {
    startTransition(async () => {
      await toggleFavorite(id);
      router.refresh();
    });
  };

  return (
    <div className="group relative">
      <Link
        href={`/board/${id}`}
        className="block overflow-hidden rounded-2xl border bg-card shadow-xs outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <BoardThumbnail id={id} />

        <div className="py-4 pl-5 pr-14">
          <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">by {authorName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Created {createdAtLabel}</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onFavorite}
        disabled={isPending}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute right-3 top-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm outline-none transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        <Star className={cn("size-4 text-primary", isFavorite && "fill-primary")} />
      </button>

      <Actions id={id} title={title}>
        <button
          type="button"
          aria-label="Board actions"
          className="absolute bottom-[18px] right-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </Actions>
    </div>
  );
};
