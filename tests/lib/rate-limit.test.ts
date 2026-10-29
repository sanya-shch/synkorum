import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const opts = { limit: 3, windowMs: 60_000 };
let n = 0;
const uniqueKey = () => `test:${++n}`;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit; i++) {
      expect(checkRateLimit(key, opts).allowed).toBe(true);
    }
  });

  it("blocks the request after the limit and reports retryAfterSeconds", () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit; i++) checkRateLimit(key, opts);

    vi.advanceTimersByTime(10_000);
    const result = checkRateLimit(key, opts);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(50);
  });

  it("resets after the window has passed", () => {
    const key = uniqueKey();
    for (let i = 0; i < opts.limit + 1; i++) checkRateLimit(key, opts);

    vi.advanceTimersByTime(opts.windowMs + 1);

    expect(checkRateLimit(key, opts).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = uniqueKey();
    const b = uniqueKey();
    for (let i = 0; i < opts.limit; i++) checkRateLimit(a, opts);

    expect(checkRateLimit(a, opts).allowed).toBe(false);
    expect(checkRateLimit(b, opts).allowed).toBe(true);
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
