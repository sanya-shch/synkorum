import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import { deleteBoardRoomMock } from "../mocks/liveblocks-server";

const { cookieSetMock, verifyPasswordMock } = vi.hoisted(() => ({
  cookieSetMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ set: cookieSetMock }) }));
vi.mock("@/lib/password", () => ({ verifyPassword: verifyPasswordMock }));

import { deleteAccount } from "@/actions/account";

const user = { id: "u1", email: "me@a.com", name: "Me", hashedPassword: "hash", isDemo: false };

const stubTransaction = () => prismaMock.$transaction.mockResolvedValue([] as never);

beforeEach(() => {
  currentUserMock.mockResolvedValue(user);
  verifyPasswordMock.mockReset().mockResolvedValue(true);
  cookieSetMock.mockReset();
  stubTransaction();
});

describe("deleteAccount", () => {
  it("refuses a wrong password and deletes nothing", async () => {
    verifyPasswordMock.mockResolvedValue(false);

    const result = await deleteAccount("nope");

    expect(result).toEqual({ error: "Incorrect password" });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses demo accounts (they expire on their own)", async () => {
    currentUserMock.mockResolvedValue({ ...user, isDemo: true });

    const result = await deleteAccount("pw");

    expect(result).toMatchObject({ error: expect.stringContaining("24 hours") });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("deletes teams where the user is alone, with the room of every board in them", async () => {
    prismaMock.membership.findMany
      .mockResolvedValueOnce([
        { role: "ADMIN", organization: { id: "solo", name: "Solo" } },
      ] as never)
      .mockResolvedValueOnce([] as never); // nobody else in "solo"
    prismaMock.board.findMany.mockResolvedValue([{ id: "b1" }, { id: "b2" }] as never);

    const result = await deleteAccount("pw");

    expect(result).toEqual({ success: "Your account was deleted" });
    expect(prismaMock.organization.deleteMany.mock.calls[0][0]?.where).toEqual({
      id: { in: ["solo"] },
    });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b1");
    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b2");
    // Session is cleared so the deleted account can't keep a cookie around.
    expect(cookieSetMock).toHaveBeenCalledWith(
      "session",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("only leaves a shared team when another admin remains", async () => {
    prismaMock.membership.findMany
      .mockResolvedValueOnce([
        { role: "ADMIN", organization: { id: "shared", name: "Shared" } },
      ] as never)
      .mockResolvedValueOnce([{ role: "ADMIN" }, { role: "MEMBER" }] as never);
    prismaMock.board.findMany.mockResolvedValue([]);

    const result = await deleteAccount("pw");

    expect(result).toEqual({ success: "Your account was deleted" });
    expect(prismaMock.organization.deleteMany.mock.calls[0][0]?.where).toEqual({ id: { in: [] } });
    expect(deleteBoardRoomMock).not.toHaveBeenCalled();
  });

  it("refuses to orphan a shared team: the last admin must hand over first", async () => {
    prismaMock.membership.findMany
      .mockResolvedValueOnce([
        { role: "ADMIN", organization: { id: "shared", name: "Acme" } },
      ] as never)
      .mockResolvedValueOnce([{ role: "MEMBER" }] as never);

    const result = await deleteAccount("pw");

    expect(result).toMatchObject({ error: expect.stringContaining('"Acme"') });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("rate-limits password guessing per account", async () => {
    verifyPasswordMock.mockResolvedValue(false);
    for (let i = 0; i < 5; i++) await deleteAccount("bad");

    const result = await deleteAccount("bad");

    expect(result).toMatchObject({ error: expect.stringContaining("Too many") });
  });
});
