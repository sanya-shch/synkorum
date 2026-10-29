import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import {
  inviteMemberByEmail,
  acceptOrgInvite,
  createBoardShareLink,
  revokeInvite,
  revokeBoardShareLink,
} from "@/actions/invite";

const ADMIN_ID = "admin_1";
const ORG_ID = "org_1";

const adminMembership = {
  id: "m_admin",
  userId: ADMIN_ID,
  organizationId: ORG_ID,
  role: "ADMIN" as const,
  createdAt: new Date(),
};

beforeEach(() => {
  currentUserMock.mockResolvedValue({ id: ADMIN_ID, email: "admin@a.com", name: "Admin" });
});

describe("inviteMemberByEmail", () => {
  it("rejects a non-admin caller", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({
      ...adminMembership,
      role: "MEMBER",
    });

    const result = await inviteMemberByEmail({
      organizationId: ORG_ID,
      email: "new@a.com",
      role: "MEMBER",
    });

    expect(result).toEqual({ error: "Administrator rights required" });
  });

  it("rejects inviting someone who is already a member", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Team",
      slug: "team",
    } as any);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing_user",
      email: "existing@a.com",
      memberships: [{ id: "m1" }],
    } as any);

    const result = await inviteMemberByEmail({
      organizationId: ORG_ID,
      email: "existing@a.com",
      role: "MEMBER",
    });

    expect(result).toEqual({ error: "This user is already in the team" });
  });
});

describe("acceptOrgInvite", () => {
  it("rejects an expired invite", async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: "invite_1",
      organizationId: ORG_ID,
      email: "user@a.com",
      role: "MEMBER",
      token: "tok",
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });

    const result = await acceptOrgInvite("tok");

    expect(result).toEqual({ error: "The invitation is invalid or expired." });
  });

  it("rejects an invite meant for a different email than the logged-in user", async () => {
    currentUserMock.mockResolvedValue({ id: "u2", email: "actual-user@a.com", name: "U" });
    prismaMock.invite.findUnique.mockResolvedValue({
      id: "invite_1",
      organizationId: ORG_ID,
      email: "someone-else@a.com",
      role: "MEMBER",
      token: "tok",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
    });

    const result = await acceptOrgInvite("tok");

    expect(result).toEqual({
      error:
        "This invitation was issued to a different email address. Please log in with that account.",
    });
    expect(prismaMock.membership.create).not.toHaveBeenCalled();
  });

  it("creates membership and deletes the invite on a valid match", async () => {
    currentUserMock.mockResolvedValue({ id: "u2", email: "user@a.com", name: "U" });
    prismaMock.invite.findUnique.mockResolvedValue({
      id: "invite_1",
      organizationId: ORG_ID,
      email: "user@a.com",
      role: "MEMBER",
      token: "tok",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
    });
    prismaMock.membership.findUnique.mockResolvedValue(null);
    prismaMock.membership.create.mockResolvedValue({} as any);
    prismaMock.invite.delete.mockResolvedValue({} as any);
    prismaMock.organization.findUnique.mockResolvedValue({ id: ORG_ID, slug: "team" } as any);

    const result = await acceptOrgInvite("tok");

    expect(result).toMatchObject({ success: expect.any(String), organizationId: ORG_ID });
    expect(prismaMock.membership.create).toHaveBeenCalledWith({
      data: { userId: "u2", organizationId: ORG_ID, role: "MEMBER" },
    });
    expect(prismaMock.invite.delete).toHaveBeenCalledWith({ where: { id: "invite_1" } });
  });
});

describe("createBoardShareLink", () => {
  it("rejects a caller who is not a member of the board's org", async () => {
    prismaMock.board.findUnique.mockResolvedValue({
      id: "board_1",
      organizationId: ORG_ID,
    } as any);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await createBoardShareLink({ boardId: "board_1" });

    expect(result).toEqual({ error: "You are not a member of this organization" });
  });

  it("returns not-found for a non-existent board without leaking org info", async () => {
    prismaMock.board.findUnique.mockResolvedValue(null);

    const result = await createBoardShareLink({ boardId: "missing" });

    expect(result).toEqual({ error: "Board not found" });
  });
});

describe("revokeInvite", () => {
  it("rejects a non-admin caller", async () => {
    prismaMock.membership.findUnique.mockResolvedValue({ ...adminMembership, role: "MEMBER" });

    const result = await revokeInvite(ORG_ID, "invite_1");

    expect(result).toEqual({ error: "Administrator rights required" });
    expect(prismaMock.invite.deleteMany).not.toHaveBeenCalled();
  });

  it("only deletes an invite that belongs to the caller's organization", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.invite.deleteMany.mockResolvedValue({ count: 1 });

    const result = await revokeInvite(ORG_ID, "invite_1");

    expect(prismaMock.invite.deleteMany).toHaveBeenCalledWith({
      where: { id: "invite_1", organizationId: ORG_ID },
    });
    expect(result).toEqual({ success: "Invitation canceled" });
  });

  it("does not touch an invite from another organization", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.invite.deleteMany.mockResolvedValue({ count: 0 });

    const result = await revokeInvite(ORG_ID, "invite_of_other_org");

    expect(result).toEqual({ error: "Invitation not found" });
  });
});

describe("revokeBoardShareLink", () => {
  it("only revokes a link that belongs to the given board", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: "board_1", organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.boardShareLink.updateMany.mockResolvedValue({ count: 1 });

    const result = await revokeBoardShareLink("board_1", "link_1");

    expect(prismaMock.boardShareLink.updateMany).toHaveBeenCalledWith({
      where: { id: "link_1", boardId: "board_1" },
      data: { revoked: true },
    });
    expect(result).toEqual({ success: "Link revoked" });
  });

  it("does not revoke a link of a different board", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: "board_1", organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.boardShareLink.updateMany.mockResolvedValue({ count: 0 });

    const result = await revokeBoardShareLink("board_1", "link_of_other_board");

    expect(result).toEqual({ error: "Link not found" });
  });

  it("rejects a caller who is not a member of the board's organization", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: "board_1", organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await revokeBoardShareLink("board_1", "link_1");

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.boardShareLink.updateMany).not.toHaveBeenCalled();
  });
});
