import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/db";
import { purgeUnverifiedAccounts } from "@/lib/unverified";

const now = new Date("2026-11-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

const candidate = (id: string, email: string, orgId: string) => ({
  id,
  email,
  memberships: [{ organizationId: orgId }],
});

describe("purgeUnverifiedAccounts", () => {
  it("only considers unverified, non-demo accounts older than 24 hours", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await expect(purgeUnverifiedAccounts({ now })).resolves.toEqual({ users: 0, organizations: 0 });

    expect(prismaMock.user.findMany.mock.calls[0][0]?.where).toEqual({
      emailVerified: null,
      isDemo: false,
      createdAt: { lte: new Date(now.getTime() - DAY) },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("spares an account that still has a valid verification link (e.g. it just tried to log in)", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      candidate("u1", "fresh-link@a.com", "o1"),
      candidate("u2", "abandoned@a.com", "o2"),
    ] as never);
    prismaMock.verificationToken.findMany.mockResolvedValue([
      { email: "fresh-link@a.com" },
    ] as never);
    prismaMock.$transaction.mockResolvedValue([{ count: 1 }, { count: 1 }, { count: 1 }] as never);

    const result = await purgeUnverifiedAccounts({ now });

    expect(result).toEqual({ users: 1, organizations: 1 });
    expect(prismaMock.user.deleteMany.mock.calls[0][0]?.where).toEqual({
      id: { in: ["u2"] },
      emailVerified: null,
    });
    expect(prismaMock.verificationToken.deleteMany.mock.calls[0][0]?.where).toEqual({
      email: { in: ["abandoned@a.com"] },
    });
  });

  it("deletes a sign-up team only when nobody else is in it", async () => {
    prismaMock.user.findMany.mockResolvedValue([candidate("u1", "a@a.com", "o1")] as never);
    prismaMock.verificationToken.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockResolvedValue([{ count: 1 }, { count: 0 }, { count: 1 }] as never);

    await purgeUnverifiedAccounts({ now });

    expect(prismaMock.organization.deleteMany.mock.calls[0][0]?.where).toEqual({
      id: { in: ["o1"] },
      memberships: { every: { userId: { in: ["u1"] } } },
    });
  });

  it("does nothing when every candidate still has a valid link", async () => {
    prismaMock.user.findMany.mockResolvedValue([candidate("u1", "a@a.com", "o1")] as never);
    prismaMock.verificationToken.findMany.mockResolvedValue([{ email: "a@a.com" }] as never);

    await expect(purgeUnverifiedAccounts({ now })).resolves.toEqual({ users: 0, organizations: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
