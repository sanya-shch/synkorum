import { vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import { prismaMock } from "./mocks/db";
import { resetRateLimits } from "@/lib/rate-limit";
import { currentUserMock } from "./mocks/current-user";
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

vi.mock("@/lib/mail", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
  sendPasswordResetEmail: sendPasswordResetEmailMock,
  sendOrgInviteEmail: sendOrgInviteEmailMock,
}));

beforeEach(() => {
  resetRateLimits();
  mockReset(prismaMock);
  currentUserMock.mockReset();
  sendVerificationEmailMock.mockReset().mockResolvedValue(undefined);
  sendPasswordResetEmailMock.mockReset().mockResolvedValue(undefined);
  sendOrgInviteEmailMock.mockReset().mockResolvedValue(undefined);
});
