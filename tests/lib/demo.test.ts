import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";

const { seedBoardRoomMock, deleteBoardRoomMock } = vi.hoisted(() => ({
  seedBoardRoomMock: vi.fn(),
  deleteBoardRoomMock: vi.fn(),
}));

vi.mock("@/lib/liveblocks-server", () => ({
  seedBoardRoom: seedBoardRoomMock,
  deleteBoardRoom: deleteBoardRoomMock,
}));

import { assertNotDemo, createDemoSession, DemoCapacityError, purgeExpiredDemos } from "@/lib/demo";
import { DEMO_LIMITS, DEMO_TTL_MS } from "@/lib/demo-config";

beforeEach(() => {
  seedBoardRoomMock.mockReset().mockResolvedValue(undefined);
  deleteBoardRoomMock.mockReset().mockResolvedValue(undefined);
  prismaMock.$transaction.mockImplementation((async (fn: unknown) =>
    typeof fn === "function" ? fn(prismaMock) : fn) as never);
});

describe("createDemoSession", () => {
  const stubCreate = () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.create.mockResolvedValue({
      id: "u1",
      name: "Demo visitor",
      memberships: [{ organizationId: "org1" }],
    } as never);
    prismaMock.board.create.mockResolvedValue({ id: "b1" } as never);
  };

  it("refuses once the global demo budget is used up, without creating anything", async () => {
    prismaMock.user.count.mockResolvedValue(DEMO_LIMITS.maxActiveSessions);

    await expect(createDemoSession()).rejects.toBeInstanceOf(DemoCapacityError);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("counts only demo accounts created inside the last 24 hours", async () => {
    stubCreate();
    const now = new Date("2026-11-20T12:00:00Z");

    await createDemoSession(now);

    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: { isDemo: true, createdAt: { gt: new Date(now.getTime() - DEMO_TTL_MS) } },
    });
  });

  it("creates a mail-less, password-less, pre-verified demo user with its own team and board", async () => {
    stubCreate();

    const { board } = await createDemoSession();

    const { data } = prismaMock.user.create.mock.calls[0][0];
    expect(data.isDemo).toBe(true);
    expect(data.email).toMatch(/^demo-.+@demo\.invalid$/);
    expect(data.hashedPassword).toBe("!");
    expect(data.emailVerified).toBeInstanceOf(Date);
    expect(prismaMock.board.create.mock.calls[0][0].data.organizationId).toBe("org1");
    expect(board.id).toBe("b1");
  });

  it("seeds the welcome board into its Liveblocks room", async () => {
    stubCreate();

    await createDemoSession();

    expect(seedBoardRoomMock).toHaveBeenCalledTimes(1);
    const [roomId, storage] = seedBoardRoomMock.mock.calls[0];
    expect(roomId).toBe("b1");
    expect(Object.keys(storage.data.layers.data).length).toBeGreaterThan(5);
    expect(storage.data.layerIds.data).toHaveLength(Object.keys(storage.data.layers.data).length);
  });

  it("still starts the demo when seeding the board fails", async () => {
    stubCreate();
    seedBoardRoomMock.mockRejectedValue(new Error("liveblocks down"));

    await expect(createDemoSession()).resolves.toMatchObject({ board: { id: "b1" } });
  });
});

describe("purgeExpiredDemos", () => {
  const now = new Date("2026-11-20T12:00:00Z");

  it("does nothing (and starts no transaction) when nothing has expired", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await expect(purgeExpiredDemos({ now })).resolves.toEqual({
      users: 0,
      organizations: 0,
      rooms: 0,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("looks only at demo accounts older than the TTL", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await purgeExpiredDemos({ now });

    expect(prismaMock.user.findMany.mock.calls[0][0]?.where).toEqual({
      isDemo: true,
      createdAt: { lte: new Date(now.getTime() - DEMO_TTL_MS) },
    });
  });

  it("deletes the Liveblocks rooms, then the demo-only teams and the demo users", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "u1", memberships: [{ organizationId: "o1" }] },
      { id: "u2", memberships: [{ organizationId: "o2" }] },
    ] as never);
    prismaMock.board.findMany.mockResolvedValue([{ id: "b1" }, { id: "b2" }] as never);
    prismaMock.$transaction.mockResolvedValue([{ count: 2 }, { count: 2 }] as never);

    const result = await purgeExpiredDemos({ now });

    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b1");
    expect(deleteBoardRoomMock).toHaveBeenCalledWith("b2");
    expect(result).toEqual({ users: 2, organizations: 2, rooms: 2 });

    // A real team must never be deleted: only teams made up solely of demo users qualify.
    const orgWhere = prismaMock.organization.deleteMany.mock.calls[0][0]?.where;
    expect(orgWhere).toMatchObject({
      id: { in: ["o1", "o2"] },
      memberships: { every: { user: { isDemo: true } } },
    });
    expect(prismaMock.user.deleteMany.mock.calls[0][0]?.where).toEqual({
      id: { in: ["u1", "u2"] },
      isDemo: true,
    });
  });
});

describe("assertNotDemo", () => {
  it("throws a 403 AppError for demo users and passes everyone else", () => {
    expect(() => assertNotDemo({ isDemo: true }, "nope")).toThrow("nope");
    expect(() => assertNotDemo({ isDemo: false }, "nope")).not.toThrow();
    expect(() => assertNotDemo({}, "nope")).not.toThrow();
  });
});
