import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import { getOrganizationMembers } from "@/actions/organization";

const ORG_ID = "org_1";

beforeEach(() => {
  currentUserMock.mockResolvedValue({ id: "me", email: "me@a.com", name: "Me" });
  prismaMock.membership.findUnique.mockResolvedValue({
    id: "m1",
    userId: "me",
    organizationId: ORG_ID,
    role: "MEMBER",
    createdAt: new Date(),
  } as never);
  prismaMock.membership.findMany.mockResolvedValue([
    {
      userId: "me",
      role: "MEMBER",
      user: { id: "me", name: "Me", email: "me@a.com", image: null },
    },
    {
      userId: "boss",
      role: "ADMIN",
      user: { id: "boss", name: "Boss", email: "boss@a.com", image: "https://img/boss.png" },
    },
  ] as never);
});

describe("getOrganizationMembers", () => {
  it("returns the members with their avatars and tells the caller which one is them", async () => {
    const result = await getOrganizationMembers(ORG_ID);

    expect(result).toEqual({
      currentUserId: "me",
      members: [
        { userId: "me", role: "MEMBER", user: { name: "Me", email: "me@a.com", image: null } },
        {
          userId: "boss",
          role: "ADMIN",
          user: { name: "Boss", email: "boss@a.com", image: "https://img/boss.png" },
        },
      ],
    });
  });

  it("is refused to people who are not in the team", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await getOrganizationMembers(ORG_ID);

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.membership.findMany).not.toHaveBeenCalled();
  });
});
