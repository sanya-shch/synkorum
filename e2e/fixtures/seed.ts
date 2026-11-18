import { db } from "../../lib/db";
import { hashPassword } from "../../lib/password";
import { generateBoardShareToken } from "../../lib/tokens";

// Seeds a verified user with an admin membership on a fresh org, plus one board and
// an editable anonymous share link for it. Bypasses the real email-verification and
// UI-driven share-link-creation flows on purpose: those are already covered by unit
// tests (tests/api/register.test.ts, tests/api/liveblocks-auth.test.ts) and by the
// login E2E test below - seeding keeps this fixture fast and focused on the one
// thing only a real browser + real Liveblocks project can prove: that two
// independent sessions editing the same board actually see each other's changes.
// Lighter fixture for auth-only tests that don't need a board or org at all.
export async function seedVerifiedUser() {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = `e2e-auth-${suffix}@example.com`;
  const password = "e2e-test-password-123";

  await db.user.create({
    data: {
      name: "E2E Auth User",
      email,
      hashedPassword: await hashPassword(password),
      emailVerified: new Date(),
    },
  });

  return { email, password };
}

export async function seedBoardWithEditableShareLink() {
  const suffix = Date.now().toString(36);
  const email = `e2e-owner-${suffix}@example.com`;
  const password = "e2e-test-password-123";

  const user = await db.user.create({
    data: {
      name: "E2E Owner",
      email,
      hashedPassword: await hashPassword(password),
      emailVerified: new Date(),
    },
  });

  const organization = await db.organization.create({
    data: { name: "E2E Org", slug: `e2e-org-${suffix}` },
  });

  await db.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "ADMIN" },
  });

  const board = await db.board.create({
    data: {
      title: "E2E Board",
      organizationId: organization.id,
      authorId: user.id,
      authorName: user.name,
    },
  });

  const shareLink = await generateBoardShareToken({ boardId: board.id, canEdit: true });

  return {
    ownerEmail: email,
    ownerPassword: password,
    boardId: board.id,
    shareLinkToken: shareLink.token,
  };
}

// Cleans up everything seedBoardWithEditableShareLink created. Boards/memberships
// cascade from the organization (see the @relation(onDelete: Cascade) in
// prisma/schema.prisma), so deleting the org and the user is enough.
export async function cleanupSeededUser(ownerEmail: string) {
  const user = await db.user.findUnique({
    where: { email: ownerEmail },
    include: { memberships: true },
  });
  if (!user) return;

  for (const membership of user.memberships) {
    await db.organization.delete({ where: { id: membership.organizationId } }).catch(() => {});
  }
  await db.user.delete({ where: { id: user.id } }).catch(() => {});
}
