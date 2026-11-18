import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { AppError } from "./errors";

export const getMembership = async (organizationId: string) => {
  const user = await requireUser();

  return db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
};

export const requireOrgMember = async (organizationId: string) => {
  const membership = await getMembership(organizationId);
  if (!membership) throw new AppError("You are not a member of this organization", 403);
  return membership;
};

export const requireOrgAdmin = async (organizationId: string) => {
  const membership = await requireOrgMember(organizationId);
  if (membership.role !== "ADMIN") throw new AppError("Administrator rights required", 403);
  return membership;
};

// Loads a board and checks the caller belongs to its organization. Every board action
// starts with this, so the lookup and the error live in one place.
export const requireBoardMember = async (boardId: string) => {
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError("Board not found", 404);

  await requireOrgMember(board.organizationId);
  return board;
};

// Pass the transaction client when the check and the following membership change must be
// atomic - otherwise two admins leaving at the same moment could both pass the check.
export const assertNotLastAdmin = async (
  organizationId: string,
  userId: string,
  client: Prisma.TransactionClient = db,
) => {
  const [admins, target] = await Promise.all([
    client.membership.count({ where: { organizationId, role: "ADMIN" } }),
    client.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    }),
  ]);

  if (target?.role === "ADMIN" && admins <= 1) {
    throw new AppError("You can't leave a team without any admin", 400);
  }
};
