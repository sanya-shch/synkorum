import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import {
  getMembership,
  requireOrgMember,
  requireOrgAdmin,
  assertNotLastAdmin,
  requireBoardMember,
} from "@/lib/permissions";

const USER_ID = "user_1";
const ORG_ID = "org_1";

const membership = (overrides: Partial<{ role: "ADMIN" | "MEMBER"; userId: string }> = {}) => ({
  id: "m1",
  userId: USER_ID,
  organizationId: ORG_ID,
  role: "MEMBER" as const,
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  currentUserMock.mockResolvedValue({ id: USER_ID, email: "a@a.com", name: "A" });
});

describe("getMembership", () => {
  it("returns the membership for the current user in the given org", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(membership());

    const result = await getMembership(ORG_ID);

    expect(prismaMock.membership.findUnique).toHaveBeenCalledWith({
      where: { userId_organizationId: { userId: USER_ID, organizationId: ORG_ID } },
    });
    expect(result?.role).toBe("MEMBER");
  });

  it("returns null when there is no membership", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await getMembership(ORG_ID);

    expect(result).toBeNull();
  });
});

describe("requireOrgMember", () => {
  it("returns the membership when the user belongs to the org", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(membership());

    await expect(requireOrgMember(ORG_ID)).resolves.toMatchObject({ role: "MEMBER" });
  });

  it("throws when the user is not a member", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    await expect(requireOrgMember(ORG_ID)).rejects.toThrow(
      "You are not a member of this organization",
    );
  });
});

describe("requireOrgAdmin", () => {
  it("returns the membership for an ADMIN", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(membership({ role: "ADMIN" }));

    await expect(requireOrgAdmin(ORG_ID)).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("throws for a MEMBER who is not an admin", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(membership({ role: "MEMBER" }));

    await expect(requireOrgAdmin(ORG_ID)).rejects.toThrow("Administrator rights required");
  });

  it("throws when the user is not a member at all (not just 'not admin')", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    await expect(requireOrgAdmin(ORG_ID)).rejects.toThrow(
      "You are not a member of this organization",
    );
  });
});

describe("assertNotLastAdmin", () => {
  it("allows removing/demoting a plain MEMBER regardless of admin count", async () => {
    prismaMock.membership.count.mockResolvedValue(1);
    prismaMock.membership.findUnique.mockResolvedValue(membership({ role: "MEMBER" }));

    await expect(assertNotLastAdmin(ORG_ID, USER_ID)).resolves.toBeUndefined();
  });

  it("allows demoting/removing an ADMIN when other admins remain", async () => {
    prismaMock.membership.count.mockResolvedValue(2);
    prismaMock.membership.findUnique.mockResolvedValue(membership({ role: "ADMIN" }));

    await expect(assertNotLastAdmin(ORG_ID, USER_ID)).resolves.toBeUndefined();
  });

  it("throws when trying to remove/demote the sole remaining ADMIN", async () => {
    prismaMock.membership.count.mockResolvedValue(1);
    prismaMock.membership.findUnique.mockResolvedValue(membership({ role: "ADMIN" }));

    await expect(assertNotLastAdmin(ORG_ID, USER_ID)).rejects.toThrow(
      "You can't leave a team without any admin",
    );
  });
});

describe("requireBoardMember", () => {
  it("returns the board when the caller belongs to its organization", async () => {
    const board = { id: "b1", organizationId: ORG_ID };
    prismaMock.board.findUnique.mockResolvedValue(board as never);
    prismaMock.membership.findUnique.mockResolvedValue(membership());

    await expect(requireBoardMember("b1")).resolves.toBe(board);
  });

  it("throws 'Board not found' for an unknown board without checking membership", async () => {
    prismaMock.board.findUnique.mockResolvedValue(null);

    await expect(requireBoardMember("missing")).rejects.toThrow("Board not found");
    expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a caller outside the board's organization", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: "b1", organizationId: ORG_ID } as never);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    await expect(requireBoardMember("b1")).rejects.toThrow(
      "You are not a member of this organization",
    );
  });
});
