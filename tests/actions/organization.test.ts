import { deleteBoardRoomMock } from "../mocks/liveblocks-server";
import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import {
  createOrganization,
  removeMember,
  changeMemberRole,
  leaveOrganization,
  deleteOrganization,
} from "@/actions/organization";

const ADMIN_ID = "admin_1";
const ORG_ID = "org_1";
const TARGET_ID = "target_1";

const adminMembership = {
  id: "m_admin",
  userId: ADMIN_ID,
  organizationId: ORG_ID,
  role: "ADMIN" as const,
  createdAt: new Date(),
};

const memberMembership = {
  id: "m_member",
  userId: ADMIN_ID,
  organizationId: ORG_ID,
  role: "MEMBER" as const,
  createdAt: new Date(),
};

beforeEach(() => {
  currentUserMock.mockResolvedValue({ id: ADMIN_ID, email: "admin@a.com", name: "Admin" });
  // The last-admin guard and the membership change run in one transaction; the mock simply
  // hands the same client to the callback.
  prismaMock.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
    fn(prismaMock)) as never);
});

describe("createOrganization", () => {
  it("rejects an empty name before touching the database", async () => {
    const result = await createOrganization({ name: "" });

    expect(result).toEqual({ error: "Incorrect name" });
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });

  it("creates the org with the caller as ADMIN", async () => {
    prismaMock.organization.create.mockResolvedValue({
      id: "org_new",
      name: "New Team",
      slug: "new-team-abc123",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createOrganization({ name: "New Team" });

    expect(result).toMatchObject({ success: expect.any(String) });
    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberships: { create: { userId: ADMIN_ID, role: "ADMIN" } },
        }),
      }),
    );
  });
});

describe("last-admin guard runs atomically", () => {
  it("removeMember uses a serializable transaction", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.membership.count.mockResolvedValue(2);
    prismaMock.membership.delete.mockResolvedValue(memberMembership);

    await removeMember(ORG_ID, TARGET_ID);

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
});

describe("removeMember - authorization boundaries", () => {
  it("returns an error when the caller is not an org member at all", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await removeMember(ORG_ID, TARGET_ID);

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it("returns an error when the caller is a MEMBER, not an ADMIN", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(memberMembership);

    const result = await removeMember(ORG_ID, TARGET_ID);

    expect(result).toEqual({ error: "Administrator rights required" });
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it("blocks an admin from removing themselves via this action", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);

    const result = await removeMember(ORG_ID, ADMIN_ID);

    expect(result).toEqual({
      error: "To leave the team, use the 'Leave Team' option.",
    });
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it("blocks removing the sole remaining admin", async () => {
    prismaMock.membership.findUnique
      .mockResolvedValueOnce(adminMembership)
      .mockResolvedValueOnce({ ...adminMembership, userId: TARGET_ID });
    prismaMock.membership.count.mockResolvedValue(1);

    const result = await removeMember(ORG_ID, TARGET_ID);

    expect(result).toEqual({ error: "You can't leave a team without any admin" });
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it("allows an admin to remove a regular member", async () => {
    prismaMock.membership.findUnique
      .mockResolvedValueOnce(adminMembership)
      .mockResolvedValueOnce({ ...memberMembership, userId: TARGET_ID });
    prismaMock.membership.delete.mockResolvedValue({} as any);

    const result = await removeMember(ORG_ID, TARGET_ID);

    expect(result).toMatchObject({ success: expect.any(String) });
    expect(prismaMock.membership.delete).toHaveBeenCalledWith({
      where: { userId_organizationId: { userId: TARGET_ID, organizationId: ORG_ID } },
    });
  });
});

describe("changeMemberRole", () => {
  it("blocks demoting the sole remaining admin to MEMBER", async () => {
    prismaMock.membership.findUnique.mockResolvedValueOnce(adminMembership);
    prismaMock.membership.count.mockResolvedValue(1);
    prismaMock.membership.findUnique.mockResolvedValueOnce({
      ...adminMembership,
      userId: TARGET_ID,
    });

    const result = await changeMemberRole(ORG_ID, TARGET_ID, "MEMBER");

    expect(result).toEqual({ error: "You can't leave a team without any admin" });
    expect(prismaMock.membership.update).not.toHaveBeenCalled();
  });

  it("allows promoting a member to ADMIN without the last-admin check", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.membership.update.mockResolvedValue({} as any);

    const result = await changeMemberRole(ORG_ID, TARGET_ID, "ADMIN");

    expect(result).toMatchObject({ success: expect.any(String) });
    expect(prismaMock.membership.count).not.toHaveBeenCalled();
  });

  it("rejects a non-admin caller", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(memberMembership);

    const result = await changeMemberRole(ORG_ID, TARGET_ID, "ADMIN");

    expect(result).toEqual({ error: "Administrator rights required" });
  });
});

describe("leaveOrganization", () => {
  it("blocks the sole remaining admin from leaving", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.membership.count.mockResolvedValue(1);

    const result = await leaveOrganization(ORG_ID);

    expect(result).toEqual({ error: "You can't leave a team without any admin" });
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it("allows a regular member to leave freely", async () => {
    currentUserMock.mockResolvedValue({ id: TARGET_ID, email: "m@a.com", name: "M" });
    prismaMock.membership.findUnique.mockResolvedValue({
      ...memberMembership,
      userId: TARGET_ID,
    } as any);
    prismaMock.membership.delete.mockResolvedValue({} as any);

    const result = await leaveOrganization(ORG_ID);

    expect(result).toMatchObject({ success: expect.any(String) });
  });
});

describe("deleteOrganization", () => {
  it("rejects a non-admin caller", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(memberMembership);

    const result = await deleteOrganization(ORG_ID);

    expect(result).toEqual({ error: "Administrator rights required" });
    expect(prismaMock.organization.delete).not.toHaveBeenCalled();
  });

  it("allows an admin to delete the org", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.board.findMany.mockResolvedValue([]);
    prismaMock.organization.delete.mockResolvedValue({} as any);

    const result = await deleteOrganization(ORG_ID);

    expect(result).toMatchObject({ success: expect.any(String) });
    expect(prismaMock.organization.delete).toHaveBeenCalledWith({ where: { id: ORG_ID } });
  });

  it("also deletes the Liveblocks room of every board in the deleted team", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(adminMembership);
    prismaMock.board.findMany.mockResolvedValue([{ id: "b1" }, { id: "b2" }] as any);
    prismaMock.organization.delete.mockResolvedValue({} as any);

    await deleteOrganization(ORG_ID);

    expect(deleteBoardRoomMock).toHaveBeenCalledTimes(2);
    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b1");
    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b2");
  });
});
