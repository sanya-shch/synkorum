import { describe, it, expect, vi, beforeEach } from "vitest";

const { getRedisMock } = vi.hoisted(() => ({ getRedisMock: vi.fn() }));
vi.mock("@/lib/redis", () => ({ getRedis: getRedisMock }));

import { PORTFOLIO_LIMITS } from "@/lib/portfolio";

// tests/setup.ts already imported the real module (for resetEmailBudget), so load a fresh
// copy that sees the redis mock above.
let assertEmailBudget: typeof import("@/lib/email-budget").assertEmailBudget;
let EmailBudgetError: typeof import("@/lib/email-budget").EmailBudgetError;
let emailBudgetAvailable: typeof import("@/lib/email-budget").emailBudgetAvailable;
let reserveEmailSlot: typeof import("@/lib/email-budget").reserveEmailSlot;

const day = new Date("2026-11-20T10:00:00Z");
const nextDay = new Date("2026-11-21T00:00:01Z");

beforeEach(async () => {
  vi.resetModules();
  ({ assertEmailBudget, EmailBudgetError, emailBudgetAvailable, reserveEmailSlot } =
    await import("@/lib/email-budget"));
  getRedisMock.mockReset().mockReturnValue(null);
});

describe("email budget (in memory)", () => {
  it("allows exactly the daily budget, then refuses", async () => {
    for (let i = 0; i < PORTFOLIO_LIMITS.emailsPerDay; i++) {
      expect(await reserveEmailSlot(day)).toBe(true);
    }

    expect(await reserveEmailSlot(day)).toBe(false);
    expect(await emailBudgetAvailable(day)).toBe(false);
  });

  it("starts a fresh budget on the next UTC day", async () => {
    for (let i = 0; i <= PORTFOLIO_LIMITS.emailsPerDay; i++) await reserveEmailSlot(day);

    expect(await emailBudgetAvailable(nextDay)).toBe(true);
    expect(await reserveEmailSlot(nextDay)).toBe(true);
  });

  it("checking availability does not consume a slot", async () => {
    for (let i = 0; i < 10; i++) await emailBudgetAvailable(day);

    for (let i = 0; i < PORTFOLIO_LIMITS.emailsPerDay; i++) {
      expect(await reserveEmailSlot(day)).toBe(true);
    }
  });

  it("assertEmailBudget throws the friendly user-facing error when the day is full", async () => {
    for (let i = 0; i < PORTFOLIO_LIMITS.emailsPerDay; i++) await reserveEmailSlot();

    await expect(assertEmailBudget()).rejects.toBeInstanceOf(EmailBudgetError);
    await expect(assertEmailBudget()).rejects.toThrow(/email limit/);
  });
});

describe("email budget (Upstash Redis)", () => {
  const redis = { incr: vi.fn(), expire: vi.fn(), get: vi.fn() };

  beforeEach(() => {
    redis.incr.mockReset();
    redis.expire.mockReset().mockResolvedValue(1);
    redis.get.mockReset();
    getRedisMock.mockReturnValue(redis);
  });

  it("counts in a per-day key and sets its expiry only when the key is created", async () => {
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await reserveEmailSlot(day);
    await reserveEmailSlot(day);

    expect(redis.incr).toHaveBeenCalledWith("synkorum:email-budget:2026-11-20");
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it("refuses once the shared counter passes the budget", async () => {
    redis.incr.mockResolvedValue(PORTFOLIO_LIMITS.emailsPerDay + 1);
    expect(await reserveEmailSlot(day)).toBe(false);

    redis.get.mockResolvedValue(PORTFOLIO_LIMITS.emailsPerDay);
    expect(await emailBudgetAvailable(day)).toBe(false);
  });

  it("lets emails through when Redis fails - Brevo enforces the real limit anyway", async () => {
    redis.incr.mockRejectedValue(new Error("down"));
    redis.get.mockRejectedValue(new Error("down"));

    expect(await reserveEmailSlot(day)).toBe(true);
    expect(await emailBudgetAvailable(day)).toBe(true);
  });
});
