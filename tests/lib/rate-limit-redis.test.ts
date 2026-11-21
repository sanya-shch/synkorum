import { describe, it, expect, vi, beforeEach } from "vitest";

const { limitMock, fixedWindowMock, getRedisMock } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  fixedWindowMock: vi.fn(() => "fixed-window"),
  getRedisMock: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({ getRedis: getRedisMock }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static fixedWindow = fixedWindowMock;
    limit = limitMock;
  },
}));

// tests/setup.ts already imported the real module (for resetRateLimits), so load a fresh copy
// that sees the mocks above.
let checkRateLimit: typeof import("@/lib/rate-limit").checkRateLimit;

const opts = { limit: 3, windowMs: 60_000 };

beforeEach(async () => {
  vi.resetModules();
  ({ checkRateLimit } = await import("@/lib/rate-limit"));
  limitMock.mockReset();
  fixedWindowMock.mockClear();
  getRedisMock.mockReset().mockReturnValue({});
});

describe("checkRateLimit with Upstash Redis", () => {
  it("delegates to Upstash with the configured window", async () => {
    limitMock.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });

    const result = await checkRateLimit("redis:1", opts);

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(fixedWindowMock).toHaveBeenCalledWith(3, "60000 ms");
    expect(limitMock).toHaveBeenCalledWith("redis:1");
  });

  it("reports how long to wait when Upstash says no", async () => {
    limitMock.mockResolvedValue({ success: false, reset: Date.now() + 42_000 });

    const result = await checkRateLimit("redis:2", opts);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(41);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(42);
  });

  it("falls back to the in-memory window when Redis is unreachable, instead of locking everyone out", async () => {
    limitMock.mockRejectedValue(new Error("network"));

    const results = [];
    for (let i = 0; i < 4; i++)
      results.push((await checkRateLimit("redis:fallback", opts)).allowed);

    expect(results).toEqual([true, true, true, false]);
  });
});
