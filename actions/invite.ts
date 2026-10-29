"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { requireOrgAdmin, requireOrgMember } from "@/lib/permissions";
import { toActionResult } from "@/lib/action-result";
import { InviteMemberSchema, CreateBoardShareLinkSchema } from "@/schemas";
import { generateOrgInviteToken, generateBoardShareToken } from "@/lib/tokens";
import { sendOrgInviteEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

export const inviteMemberByEmail = async (values: z.infer<typeof InviteMemberSchema>) =>
  toActionResult(async () => {
    const validated = InviteMemberSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect data" };

    const { organizationId, email, role } = validated.data;
    await requireOrgAdmin(organizationId);

    // Each invitation sends an email from our domain - don't let one account turn that
    // into a spam cannon.
    const { allowed } = checkRateLimit(`invite:${organizationId}`, {
      limit: 20,
      windowMs: 60 * 60_000,
    });
    if (!allowed) return { error: "Too many invitations. Please try again later." };

    const organization = await db.organization.findUnique({ where: { id: organizationId } });
    if (!organization) return { error: "Team not found" };

    const existingMember = await db.user.findUnique({
      where: { email },
      include: { memberships: { where: { organizationId } } },
    });
    if (existingMember && existingMember.memberships.length > 0) {
      return { error: "This user is already in the team" };
    }

    const invite = await generateOrgInviteToken({ organizationId, email, role });
    await sendOrgInviteEmail({ email, token: invite.token, organizationName: organization.name });

    return { success: `Invitation sent to ${email}` };
  });

export const acceptOrgInvite = async (token: string) =>
  toActionResult(async () => {
    const user = await requireUser();

    const invite = await db.invite.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      return { error: "The invitation is invalid or expired." };
    }
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return {
        error:
          "This invitation was issued to a different email address. Please log in with that account.",
      };
    }

    const existing = await db.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
    });

    if (!existing) {
      await db.membership.create({
        data: { userId: user.id, organizationId: invite.organizationId, role: invite.role },
      });
    }

    await db.invite.delete({ where: { id: invite.id } });

    const organization = await db.organization.findUnique({ where: { id: invite.organizationId } });
    return { success: "You have joined the team", organizationId: organization?.id };
  });

export const revokeInvite = async (organizationId: string, inviteId: string) =>
  toActionResult(async () => {
    await requireOrgAdmin(organizationId);

    // Scope the delete to the organization the caller is an admin of. Deleting by id
    // alone would let an admin of org A cancel invitations that belong to org B.
    const { count } = await db.invite.deleteMany({ where: { id: inviteId, organizationId } });
    if (count === 0) return { error: "Invitation not found" };

    return { success: "Invitation canceled" };
  });

export const createBoardShareLink = async (values: z.infer<typeof CreateBoardShareLinkSchema>) =>
  toActionResult(async () => {
    const validated = CreateBoardShareLinkSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect data" };

    const { boardId, expiresInDays, canEdit } = validated.data;

    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return { error: "Board not found" };

    await requireOrgMember(board.organizationId);

    const link = await generateBoardShareToken({ boardId, expiresInDays, canEdit });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/board-link/${link.token}`;
    return { success: "Link created", shareUrl, linkId: link.id };
  });

export const revokeBoardShareLink = async (boardId: string, linkId: string) =>
  toActionResult(async () => {
    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return { error: "Board not found" };

    await requireOrgMember(board.organizationId);

    // Scope the update to this board: the caller was only authorized for `boardId`,
    // so a linkId belonging to a different board must not be touched.
    const { count } = await db.boardShareLink.updateMany({
      where: { id: linkId, boardId },
      data: { revoked: true },
    });
    if (count === 0) return { error: "Link not found" };

    return { success: "Link revoked" };
  });

export const listBoardShareLinks = async (boardId: string) => {
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board) return [];

  await requireOrgMember(board.organizationId);

  return db.boardShareLink.findMany({
    where: { boardId, revoked: false },
    orderBy: { createdAt: "desc" },
  });
};

export const resolveBoardShareLink = async (token: string) => {
  const link = await db.boardShareLink.findUnique({
    where: { token },
    include: { board: true },
  });

  if (!link || link.revoked) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  return link;
};
