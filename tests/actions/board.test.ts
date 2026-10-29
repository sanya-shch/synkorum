import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import { createBoard, deleteBoard, updateBoardTitle, toggleFavorite } from "@/actions/board";

const USER_ID = "user_1";
const ORG_ID = "org_1";
const BOARD_ID = "board_1";

beforeEach(() => {
  currentUserMock.mockResolvedValue({ id: USER_ID, email: "a@a.com", name: "A" });
});

describe("createBoard", () => {
  it("rejects a caller who is not a member of the org", async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await createBoard({
      organizationId: ORG_ID,
      title: "New board",
      imageUrl: "https://example.com/x.svg",
    });

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.board.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid payload before touching the database", async () => {
    const result = await createBoard({
      organizationId: ORG_ID,
      title: "",
      imageUrl: "not-a-url",
    });

    expect(result).toEqual({ error: "Incorrect data" });
    expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
  });
});

describe("deleteBoard / updateBoardTitle - board-level authorization", () => {
  it("deleteBoard rejects a non-member", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: BOARD_ID, organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await deleteBoard(BOARD_ID);

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.board.delete).not.toHaveBeenCalled();
  });

  it("deleteBoard returns not-found without leaking org membership requirements", async () => {
    prismaMock.board.findUnique.mockResolvedValue(null);

    const result = await deleteBoard("missing");

    expect(result).toEqual({ error: "Board not found" });
    expect(prismaMock.membership.findUnique).not.toHaveBeenCalled();
  });

  it("updateBoardTitle rejects a title over 60 chars before any DB call", async () => {
    const result = await updateBoardTitle(BOARD_ID, "x".repeat(61));

    expect(result).toEqual({ error: "The name must be 1-60 characters" });
    expect(prismaMock.board.findUnique).not.toHaveBeenCalled();
  });

  it("updateBoardTitle rejects a non-member", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: BOARD_ID, organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await updateBoardTitle(BOARD_ID, "New title");

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.board.update).not.toHaveBeenCalled();
  });
});

describe("toggleFavorite", () => {
  it("adds to favorites when not already favorited", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: BOARD_ID, organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "m1",
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "MEMBER",
      createdAt: new Date(),
    });
    prismaMock.boardFavorite.findUnique.mockResolvedValue(null);
    prismaMock.boardFavorite.create.mockResolvedValue({} as any);

    const result = await toggleFavorite(BOARD_ID);

    expect(result).toMatchObject({ favorited: true });
    expect(prismaMock.boardFavorite.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, boardId: BOARD_ID },
    });
  });

  it("removes from favorites when already favorited", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: BOARD_ID, organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue({
      id: "m1",
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "MEMBER",
      createdAt: new Date(),
    });
    prismaMock.boardFavorite.findUnique.mockResolvedValue({ id: "fav_1" } as any);
    prismaMock.boardFavorite.delete.mockResolvedValue({} as any);

    const result = await toggleFavorite(BOARD_ID);

    expect(result).toMatchObject({ favorited: false });
    expect(prismaMock.boardFavorite.delete).toHaveBeenCalledWith({ where: { id: "fav_1" } });
  });

  it("rejects a non-member trying to favorite a board", async () => {
    prismaMock.board.findUnique.mockResolvedValue({ id: BOARD_ID, organizationId: ORG_ID } as any);
    prismaMock.membership.findUnique.mockResolvedValue(null);

    const result = await toggleFavorite(BOARD_ID);

    expect(result).toEqual({ error: "You are not a member of this organization" });
    expect(prismaMock.boardFavorite.create).not.toHaveBeenCalled();
  });
});
