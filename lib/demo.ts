import crypto from "crypto";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logError } from "@/lib/logger";
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_LIMITS,
  DEMO_MESSAGES,
  DEMO_TTL_MS,
  DEMO_UNUSABLE_PASSWORD_HASH,
} from "@/lib/demo-config";
import { buildDemoBoardStorage } from "@/lib/demo-board";
import { deleteBoardRoom, seedBoardRoom } from "@/lib/liveblocks-server";

// Thrown when the global demo budget is used up; the route answers 503 and offers the
// read-only fallback instead.
export class DemoCapacityError extends AppError {
  constructor() {
    super(DEMO_MESSAGES.capacity, 503);
    this.name = "DemoCapacityError";
  }
}

// Server-side guard used by actions: demo accounts must never reach the real action.
export const assertNotDemo = (user: { isDemo?: boolean }, message: string) => {
  if (user.isDemo) throw new AppError(message, 403);
};

// Creates a throwaway account (no real email, password login impossible) with its own team
// and a populated welcome board. Nothing here sends an email.
export async function createDemoSession(now: Date = new Date()) {
  // Demo accounts live exactly DEMO_TTL, so "created in the last DEMO_TTL" == "currently
  // active" and one counter covers both the concurrent and the per-day budget. The check is
  // not atomic with the insert, so a burst can overshoot by a few - harmless at this scale.
  const since = new Date(now.getTime() - DEMO_TTL_MS);
  const active = await db.user.count({ where: { isDemo: true, createdAt: { gt: since } } });
  if (active >= DEMO_LIMITS.maxActiveSessions) throw new DemoCapacityError();

  const suffix = crypto.randomUUID();

  const { user, board } = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: "Demo visitor",
        email: `demo-${suffix}@${DEMO_EMAIL_DOMAIN}`,
        hashedPassword: DEMO_UNUSABLE_PASSWORD_HASH,
        emailVerified: now,
        isDemo: true,
        memberships: {
          create: {
            role: "ADMIN",
            organization: { create: { name: "Demo team", slug: `demo-${suffix.slice(0, 8)}` } },
          },
        },
      },
      include: { memberships: true },
    });

    const organizationId = created.memberships[0].organizationId;
    const createdBoard = await tx.board.create({
      data: {
        title: "Welcome to Synkorum",
        organizationId,
        authorId: created.id,
        authorName: created.name,
      },
    });

    return { user: created, board: createdBoard };
  });

  // The account is fully usable without the seed (just an empty canvas), so a Liveblocks
  // hiccup must not fail the whole demo start.
  try {
    await seedBoardRoom(board.id, buildDemoBoardStorage());
  } catch (err) {
    logError("demo-seed", err);
  }

  return { user, board };
}

// Deletes demo accounts older than DEMO_TTL together with their team, boards and Liveblocks
// rooms. Safe to run as often as you like; it only touches `isDemo` users and teams that
// consist solely of demo users.
export async function purgeExpiredDemos({
  now = new Date(),
  limit = 50,
}: { now?: Date; limit?: number } = {}) {
  const cutoff = new Date(now.getTime() - DEMO_TTL_MS);

  const expired = await db.user.findMany({
    where: { isDemo: true, createdAt: { lte: cutoff } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, memberships: { select: { organizationId: true } } },
  });

  if (expired.length === 0) return { users: 0, organizations: 0, rooms: 0 };

  const userIds = expired.map((user) => user.id);
  const organizationIds = [
    ...new Set(expired.flatMap((user) => user.memberships.map((m) => m.organizationId))),
  ];
  const demoOnly = { memberships: { every: { user: { isDemo: true } } } };

  const boards = await db.board.findMany({
    where: { organizationId: { in: organizationIds }, organization: demoOnly },
    select: { id: true },
  });
  await Promise.all(boards.map((board) => deleteBoardRoom(board.id)));

  // Teams first (cascades boards, memberships, share links), then the users themselves.
  const [organizations] = await db.$transaction([
    db.organization.deleteMany({ where: { id: { in: organizationIds }, ...demoOnly } }),
    db.user.deleteMany({ where: { id: { in: userIds }, isDemo: true } }),
  ]);

  return { users: userIds.length, organizations: organizations.count, rooms: boards.length };
}
