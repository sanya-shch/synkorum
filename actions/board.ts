"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { requireBoardMember, requireOrgMember } from "@/lib/permissions";
import { toActionResult } from "@/lib/action-result";
import { CreateBoardSchema } from "@/schemas";
import { AppError } from "@/lib/errors";
import { DEMO_LIMITS, DEMO_MESSAGES } from "@/lib/demo-config";
import { deleteBoardRoom } from "@/lib/liveblocks-server";
import { IS_FOR_PORTFOLIO, PORTFOLIO_LIMITS, PORTFOLIO_MESSAGES } from "@/lib/portfolio";

export const getBoards = async (
  organizationId: string,
  query?: { search?: string; favorites?: string },
) => {
  const user = await requireUser();
  await requireOrgMember(organizationId);

  return db.board.findMany({
    where: {
      organizationId,
      title: query?.search ? { contains: query.search, mode: "insensitive" } : undefined,
      favoritedBy: query?.favorites ? { some: { userId: user.id } } : undefined,
    },
    include: { favoritedBy: { where: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });
};

export const toggleFavorite = async (boardId: string) =>
  toActionResult(async () => {
    const user = await requireUser();
    await requireBoardMember(boardId);

    // Delete first and look at how many rows went away: no read-then-write window, so a
    // double click can't try to insert the same favorite twice.
    const { count } = await db.boardFavorite.deleteMany({ where: { userId: user.id, boardId } });
    if (count > 0) return { success: "Removed from favorites", favorited: false };

    await db.boardFavorite.upsert({
      where: { userId_boardId: { userId: user.id, boardId } },
      create: { userId: user.id, boardId },
      update: {},
    });
    return { success: "Added to favorites", favorited: true };
  });

export const createBoard = async (values: z.infer<typeof CreateBoardSchema>) =>
  toActionResult(async () => {
    const validated = CreateBoardSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect data" };

    const { organizationId, title } = validated.data;
    await requireOrgMember(organizationId);
    const user = await requireUser();

    // Free-tier guard: every board becomes a Liveblocks room (500 active per month on Free).
    if (IS_FOR_PORTFOLIO && (await db.board.count()) >= PORTFOLIO_LIMITS.maxBoards) {
      throw new AppError(PORTFOLIO_MESSAGES.boards, 503);
    }

    // Enforced here, on the server: hiding the button would stop nobody.
    if (user.isDemo) {
      const boards = await db.board.count({ where: { organizationId } });
      if (boards >= DEMO_LIMITS.boards) throw new AppError(DEMO_MESSAGES.boards, 403);
    }

    const board = await db.board.create({
      data: {
        organizationId,
        title,
        authorId: user.id,
        authorName: user.name ?? "Member",
      },
    });

    return { success: "The board was created", board };
  });

export const updateBoardTitle = async (boardId: string, title: string) =>
  toActionResult(async () => {
    if (!title || title.length > 60) return { error: "The name must be 1-60 characters" };

    await requireBoardMember(boardId);

    const updated = await db.board.update({ where: { id: boardId }, data: { title } });
    return { success: "Name updated", board: updated };
  });

export const deleteBoard = async (boardId: string) =>
  toActionResult(async () => {
    await requireBoardMember(boardId);

    await db.board.delete({ where: { id: boardId } });
    // Free the room's stored data too (best effort, never fails the delete).
    await deleteBoardRoom(boardId);

    return { success: "The board was deleted" };
  });
