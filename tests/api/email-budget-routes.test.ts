import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../mocks/db";
import { runHousekeepingMock } from "../mocks/housekeeping";
import { sendPasswordResetEmailMock, sendVerificationEmailMock } from "../mocks/mail";

const { availableMock } = vi.hoisted(() => ({ availableMock: vi.fn() }));

vi.mock("@/lib/email-budget", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email-budget")>()),
  emailBudgetAvailable: availableMock,
}));
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hash"),
  verifyPassword: vi.fn().mockResolvedValue(true),
  burnPasswordCheck: vi.fn(),
}));
vi.mock("@/lib/tokens", () => ({
  generateVerificationToken: vi.fn().mockResolvedValue({ email: "a@a.com", token: "tok" }),
  generatePasswordResetToken: vi.fn().mockResolvedValue({ email: "a@a.com", token: "tok" }),
}));

import { EmailBudgetError, EMAIL_BUDGET_MESSAGE } from "@/lib/email-budget";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";

let n = 0;
const post = (handler: (r: Request) => Promise<Response>, path: string, body: unknown) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "x-forwarded-for": `10.8.0.${++n}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const signUp = () =>
  post(register, "/api/auth/register", {
    name: "Ann",
    email: "a@a.com",
    password: "Str0ngPassw0rd!",
  });

beforeEach(() => {
  availableMock.mockReset().mockResolvedValue(true);
});

describe("when the daily email budget is used up", () => {
  it("register refuses up front with a friendly message and creates nothing", async () => {
    availableMock.mockResolvedValue(false);

    const res = await signUp();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: EMAIL_BUDGET_MESSAGE });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("register explains it when the budget runs out between the check and the send", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockResolvedValue({} as never);
    sendVerificationEmailMock.mockRejectedValue(new EmailBudgetError());

    const res = await signUp();

    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("Your account is saved");
  });

  it("login of an unconfirmed account explains instead of failing silently", async () => {
    availableMock.mockResolvedValue(false);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@a.com",
      hashedPassword: "h",
      emailVerified: null,
      isDemo: false,
    } as never);

    const res = await post(login, "/api/auth/login", { email: "a@a.com", password: "whatever1" });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: EMAIL_BUDGET_MESSAGE });
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("forgot-password explains it - for every address alike, so nothing leaks about accounts", async () => {
    availableMock.mockResolvedValue(false);

    const res = await post(forgotPassword, "/api/auth/forgot-password", { email: "anyone@a.com" });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: EMAIL_BUDGET_MESSAGE });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });
});

describe("register", () => {
  it("tells the person they have 24 hours to confirm and sweeps abandoned accounts afterwards", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockResolvedValue({} as never);

    const res = await signUp();

    expect(res.status).toBe(200);
    expect((await res.json()).success).toContain("24 hours");
    await Promise.resolve();
    expect(runHousekeepingMock).toHaveBeenCalledWith({ limit: 25 });
  });
});
