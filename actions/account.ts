"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { toActionResult } from "@/lib/action-result";
import { AppError } from "@/lib/errors";
import { assertNotDemo } from "@/lib/demo";
import { deleteBoardRoom } from "@/lib/liveblocks-server";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { clearSessionCookie } from "@/lib/session";

// Permanently deletes the signed-in account and everything that only existed for it:
//  - teams where this person is the only member are deleted entirely - boards, share links,
//    invitations and the Liveblocks room of every board with them;
//  - in teams shared with others the person just leaves; if they are the last admin the
//    deletion is refused until someone else is promoted (or the team is deleted), so nobody
//    else is left in a team without an admin.
// Asks for the password again, as with any irreversible action on an account.
export const deleteAccount = async (password: string) =>
  toActionResult(async () => {
    const user = await requireUser();
    assertNotDemo(user, "Demo accounts are removed automatically after 24 hours.");

    const { allowed } = await checkRateLimit(`delete-account:${user.id}`, {
      limit: 5,
      windowMs: 60 * 60_000,
    });
    if (!allowed) throw new AppError("Too many attempts. Please try again later.");

    if (typeof password !== "string" || !(await verifyPassword(password, user.hashedPassword))) {
      throw new AppError("Incorrect password");
    }

    const memberships = await db.membership.findMany({
      where: { userId: user.id },
      select: { role: true, organization: { select: { id: true, name: true } } },
    });

    const soloOrganizationIds: string[] = [];
    for (const { role, organization } of memberships) {
      const others = await db.membership.findMany({
        where: { organizationId: organization.id, userId: { not: user.id } },
        select: { role: true },
      });

      if (others.length === 0) {
        soloOrganizationIds.push(organization.id);
      } else if (role === "ADMIN" && !others.some((other) => other.role === "ADMIN")) {
        throw new AppError(
          `You are the only admin of "${organization.name}". Make another member an admin (or delete the team) before deleting your account.`,
        );
      }
    }

    const boards = await db.board.findMany({
      where: { organizationId: { in: soloOrganizationIds } },
      select: { id: true },
    });

    await db.$transaction([
      // Cascades their boards, share links, invitations and memberships.
      db.organization.deleteMany({ where: { id: { in: soloOrganizationIds } } }),
      db.verificationToken.deleteMany({ where: { email: user.email } }),
      db.passwordResetToken.deleteMany({ where: { email: user.email } }),
      // Cascades remaining memberships (shared teams) and favorites.
      db.user.delete({ where: { id: user.id } }),
    ]);

    await Promise.all(boards.map((board) => deleteBoardRoom(board.id)));

    const cookie = clearSessionCookie();
    (await cookies()).set(cookie.name, cookie.value, cookie.options);

    return { success: "Your account was deleted" };
  });
