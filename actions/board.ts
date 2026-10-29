"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { requireOrgMember } from "@/lib/permissions";
import { toActionResult } from "@/lib/action-result";
import { CreateBoardSchema } from "@/schemas";

export const getBoards = async (
  organizationId: string,
  query?: { search?: string; favorites?: string },
) => {
  const user = await requireUser();
  await requireOrgMember(organizationId);

  if (query?.favorites) {
    return db.board.findMany({
      where: {
        organizationId,
        title: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
        favoritedBy: { some: { userId: user.id } },
      },
      include: { favoritedBy: { where: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return db.board.findMany({
    where: {
      organizationId,
      title: query?.search ? { contains: query.search, mode: "insensitive" } : undefined,
    },
    include: { favoritedBy: { where: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });
};

export const toggleFavorite = async (boardId: string) =>
  toActionResult(async () => {
    const user = await requireUser();

    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return { error: "Board not found" };

    await requireOrgMember(board.organizationId);

    const existing = await db.boardFavorite.findUnique({
      where: { userId_boardId: { userId: user.id, boardId } },
    });

    if (existing) {
      await db.boardFavorite.delete({ where: { id: existing.id } });
      return { success: "Removed from favorites", favorited: false };
    }

    await db.boardFavorite.create({ data: { userId: user.id, boardId } });
    return { success: "Added to favorites", favorited: true };
  });

export const createBoard = async (values: z.infer<typeof CreateBoardSchema>) =>
  toActionResult(async () => {
    const validated = CreateBoardSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect data" };

    const { organizationId, title, imageUrl } = validated.data;
    await requireOrgMember(organizationId);
    const user = await requireUser();

    const board = await db.board.create({
      data: {
        organizationId,
        title,
        imageUrl,
        authorId: user.id,
        authorName: user.name ?? "Member",
      },
    });

    return { success: "The board was created", board };
  });

export const updateBoardTitle = async (boardId: string, title: string) =>
  toActionResult(async () => {
    if (!title || title.length > 60) return { error: "The name must be 1-60 characters" };

    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return { error: "Board not found" };

    await requireOrgMember(board.organizationId);

    const updated = await db.board.update({ where: { id: boardId }, data: { title } });
    return { success: "Name updated", board: updated };
  });

export const deleteBoard = async (boardId: string) =>
  toActionResult(async () => {
    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return { error: "Board not found" };

    await requireOrgMember(board.organizationId);

    await db.board.delete({ where: { id: boardId } });

    return { success: "The board was deleted" };
  });
