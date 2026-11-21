import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { currentUserMock } from "../mocks/current-user";
import { sendOrgInviteEmailMock } from "../mocks/mail";
import { createBoard } from "@/actions/board";
import { createOrganization, deleteOrganization } from "@/actions/organization";
import { createBoardShareLink, inviteMemberByEmail } from "@/actions/invite";
import { DEMO_LIMITS, DEMO_MESSAGES } from "@/lib/demo-config";
import { PORTFOLIO_LIMITS, PORTFOLIO_MESSAGES } from "@/lib/portfolio";

const ORG_ID = "org_1";
const BOARD_ID = "board_1";

const member = (role: "ADMIN" | "MEMBER" = "ADMIN") => ({
  id: "m1",
  userId: "u1",
  organizationId: ORG_ID,
  role,
  createdAt: new Date(),
});

const signInAs = (isDemo: boolean) =>
  currentUserMock.mockResolvedValue({ id: "u1", email: "a@a.com", name: "A", isDemo });

beforeEach(() => {
  prismaMock.membership.findUnique.mockResolvedValue(member() as never);
});

describe("demo account limits (enforced on the server)", () => {
  describe("createBoard", () => {
    it("blocks a demo user who already has the maximum number of boards", async () => {
      signInAs(true);
      prismaMock.board.count.mockResolvedValue(DEMO_LIMITS.boards);

      const result = await createBoard({ organizationId: ORG_ID, title: "One more" });

      expect(result).toEqual({ error: DEMO_MESSAGES.boards });
      expect(prismaMock.board.create).not.toHaveBeenCalled();
    });

    it("lets a demo user create a board while under the limit", async () => {
      signInAs(true);
      prismaMock.board.count.mockResolvedValue(DEMO_LIMITS.boards - 1);
      prismaMock.board.create.mockResolvedValue({ id: BOARD_ID } as never);

      const result = await createBoard({ organizationId: ORG_ID, title: "Fits" });

      expect(result).toMatchObject({ success: "The board was created" });
    });

    it("applies no board limit to regular accounts", async () => {
      signInAs(false);
      prismaMock.board.create.mockResolvedValue({ id: BOARD_ID } as never);

      await createBoard({ organizationId: ORG_ID, title: "Anything" });

      // Only the global free-tier count - never the per-team demo count.
      expect(prismaMock.board.count).not.toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
      });
      expect(prismaMock.board.create).toHaveBeenCalled();
    });

    it("refuses everyone once the deployment-wide board cap is reached (portfolio mode)", async () => {
      signInAs(false);
      prismaMock.board.count.mockResolvedValue(PORTFOLIO_LIMITS.maxBoards);

      const result = await createBoard({ organizationId: ORG_ID, title: "One too many" });

      expect(result).toEqual({ error: PORTFOLIO_MESSAGES.boards });
      expect(prismaMock.board.create).not.toHaveBeenCalled();
    });
  });

  describe("teams", () => {
    it("a demo user cannot create extra teams", async () => {
      signInAs(true);

      const result = await createOrganization({ name: "Another" });

      expect(result).toEqual({ error: DEMO_MESSAGES.organizations });
      expect(prismaMock.organization.create).not.toHaveBeenCalled();
    });

    it("a demo user cannot delete their team", async () => {
      signInAs(true);

      const result = await deleteOrganization(ORG_ID);

      expect(result).toEqual({ error: DEMO_MESSAGES.deleteOrganization });
      expect(prismaMock.organization.delete).not.toHaveBeenCalled();
    });

    it("a regular admin can still create a team", async () => {
      signInAs(false);
      prismaMock.organization.create.mockResolvedValue({ id: "org_2" } as never);

      const result = await createOrganization({ name: "Another" });

      expect(result).toMatchObject({ success: "The team was created" });
    });
  });

  describe("invitations", () => {
    it("a demo user can't send an email invitation, and no email is sent", async () => {
      signInAs(true);

      const result = await inviteMemberByEmail({
        organizationId: ORG_ID,
        email: "victim@example.com",
        role: "MEMBER",
      });

      expect(result).toEqual({ error: DEMO_MESSAGES.invites });
      expect(sendOrgInviteEmailMock).not.toHaveBeenCalled();
      expect(prismaMock.invite.create).not.toHaveBeenCalled();
    });
  });

  describe("share links", () => {
    beforeEach(() => {
      prismaMock.board.findUnique.mockResolvedValue({
        id: BOARD_ID,
        organizationId: ORG_ID,
      } as never);
      prismaMock.boardShareLink.create.mockResolvedValue({ id: "l1", token: "tok" } as never);
    });

    it("blocks a demo user who already has the maximum number of active links", async () => {
      signInAs(true);
      prismaMock.boardShareLink.count.mockResolvedValue(DEMO_LIMITS.shareLinks);

      const result = await createBoardShareLink({ boardId: BOARD_ID, canEdit: true });

      expect(result).toEqual({ error: DEMO_MESSAGES.shareLinks });
      expect(prismaMock.boardShareLink.create).not.toHaveBeenCalled();
    });

    it("counts only active links of the demo team", async () => {
      signInAs(true);
      prismaMock.boardShareLink.count.mockResolvedValue(0);

      await createBoardShareLink({ boardId: BOARD_ID, canEdit: false });

      const where = prismaMock.boardShareLink.count.mock.calls[0][0]?.where;
      expect(where).toMatchObject({ revoked: false, board: { organizationId: ORG_ID } });
      expect(prismaMock.boardShareLink.create).toHaveBeenCalled();
    });

    it("applies no link limit to regular accounts", async () => {
      signInAs(false);

      await createBoardShareLink({ boardId: BOARD_ID, canEdit: true });

      expect(prismaMock.boardShareLink.count).not.toHaveBeenCalled();
      expect(prismaMock.boardShareLink.create).toHaveBeenCalled();
    });
  });
});
