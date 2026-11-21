import { db } from "@/lib/db";

// Time given to confirm an email address. Matches the lifetime of a verification token
// (lib/tokens.ts), and is what the sign-up screen promises.
export const VERIFICATION_WINDOW_HOURS = 24;
const VERIFICATION_WINDOW_MS = VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000;

// Deletes accounts that never confirmed their email: created more than 24 hours ago and with
// no verification link still valid (logging in re-sends one, which gives the person another
// window). Also removes the team that was created for them at sign-up, but only if nobody
// else is in it. Unverified accounts cannot log in, so they never own boards or rooms.
export async function purgeUnverifiedAccounts({
  now = new Date(),
  limit = 50,
}: { now?: Date; limit?: number } = {}) {
  const cutoff = new Date(now.getTime() - VERIFICATION_WINDOW_MS);

  const candidates = await db.user.findMany({
    where: { emailVerified: null, isDemo: false, createdAt: { lte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, email: true, memberships: { select: { organizationId: true } } },
  });
  if (candidates.length === 0) return { users: 0, organizations: 0 };

  const liveTokens = await db.verificationToken.findMany({
    where: { email: { in: candidates.map((user) => user.email) }, expires: { gt: now } },
    select: { email: true },
  });
  const stillValid = new Set(liveTokens.map((token) => token.email));

  const stale = candidates.filter((user) => !stillValid.has(user.email));
  if (stale.length === 0) return { users: 0, organizations: 0 };

  const userIds = stale.map((user) => user.id);
  const emails = stale.map((user) => user.email);
  const organizationIds = [
    ...new Set(stale.flatMap((user) => user.memberships.map((m) => m.organizationId))),
  ];

  const [organizations, , users] = await db.$transaction([
    // Only teams made up exclusively of the accounts being deleted.
    db.organization.deleteMany({
      where: { id: { in: organizationIds }, memberships: { every: { userId: { in: userIds } } } },
    }),
    db.verificationToken.deleteMany({ where: { email: { in: emails } } }),
    db.user.deleteMany({ where: { id: { in: userIds }, emailVerified: null } }),
  ]);

  return { users: users.count, organizations: organizations.count };
}
