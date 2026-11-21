import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const opts = { limit: 3, windowMs: 60_000 };
let n = 0;
const uniqueKey = () => `test:${++n}`;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("checkRateLimit", () => {
  it("allows requests up to the limit", async () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit; i++) {
      expect((await checkRateLimit(key, opts)).allowed).toBe(true);
    }
  });

  it("blocks the request after the limit and reports retryAfterSeconds", async () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit; i++) await checkRateLimit(key, opts);

    vi.advanceTimersByTime(10_000);
    const result = await checkRateLimit(key, opts);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(50);
  });

  it("resets after the window has passed", async () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit + 1; i++) await checkRateLimit(key, opts);

    vi.advanceTimersByTime(opts.windowMs + 1);

    expect((await checkRateLimit(key, opts)).allowed).toBe(true);
  });

  it("tracks keys independently", async () => {
    const a = uniqueKey();
    const b = uniqueKey();
    for (let i = 0; i < opts.limit; i++) await checkRateLimit(a, opts);

    expect((await checkRateLimit(a, opts)).allowed).toBe(false);
    expect((await checkRateLimit(b, opts)).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x", { headers });

  it("uses the entry added by the trusted proxy, not the client-supplied first one", () => {
    // 6.6.6.6 is spoofed by the client; 2.2.2.2 is what our (single) proxy saw.
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2");
    expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1" }))).toBe("1.1.1.1");
  });

  it("skips additional trusted proxies when TRUSTED_PROXY_COUNT is set", () => {
    vi.stubEnv("TRUSTED_PROXY_COUNT", "2");
    try {
      expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(req({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  it("returns 'unknown' when no headers are present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
