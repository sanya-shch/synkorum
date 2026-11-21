import { vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import { prismaMock } from "./mocks/db";
import { resetRateLimits } from "@/lib/rate-limit";
import { resetEmailBudget } from "@/lib/email-budget";
import { currentUserMock } from "./mocks/current-user";
import { seedBoardRoomMock, deleteBoardRoomMock } from "./mocks/liveblocks-server";
import { runHousekeepingMock } from "./mocks/housekeeping";
import {
  sendVerificationEmailMock,
  sendPasswordResetEmailMock,
  sendOrgInviteEmailMock,
} from "./mocks/mail";

process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-not-for-production";
process.env.LIVEBLOCKS_SECRET_KEY =
  process.env.LIVEBLOCKS_SECRET_KEY ?? "test-liveblocks-secret-not-for-production";

vi.mock("@/lib/db", () => ({ db: prismaMock }));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: currentUserMock,
  requireAuth: currentUserMock,
  requireUser: currentUserMock,
}));

vi.mock("@/lib/liveblocks-server", () => ({
  seedBoardRoom: seedBoardRoomMock,
  deleteBoardRoom: deleteBoardRoomMock,
}));

vi.mock("@/lib/housekeeping", () => ({ runHousekeeping: runHousekeepingMock }));

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
  sendPasswordResetEmail: sendPasswordResetEmailMock,
  sendOrgInviteEmail: sendOrgInviteEmailMock,
}));

beforeEach(() => {
  resetRateLimits();
  resetEmailBudget();
  runHousekeepingMock.mockReset().mockResolvedValue({ demos: {}, unverified: {} });
  seedBoardRoomMock.mockReset().mockResolvedValue(undefined);
  deleteBoardRoomMock.mockReset().mockResolvedValue(undefined);
  mockReset(prismaMock);
  currentUserMock.mockReset();
  sendVerificationEmailMock.mockReset().mockResolvedValue(undefined);
  sendPasswordResetEmailMock.mockReset().mockResolvedValue(undefined);
  sendOrgInviteEmailMock.mockReset().mockResolvedValue(undefined);
});
