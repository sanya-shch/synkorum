import { describe, it, expect } from "vitest";
import { buildSecurityHeaders } from "@/lib/security-headers";

const get = (headers: { key: string; value: string }[], key: string) =>
  headers.find((h) => h.key === key)?.value;

describe("buildSecurityHeaders", () => {
  const prod = buildSecurityHeaders({ isProd: true });
  const dev = buildSecurityHeaders({ isProd: false });

  it("forbids framing and plugins, pins base-uri and form targets", () => {
    const csp = get(prod, "Content-Security-Policy")!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(get(prod, "X-Frame-Options")).toBe("DENY");
  });

  it("allows Liveblocks connections", () => {
    const csp = get(prod, "Content-Security-Policy")!;
    expect(csp).toContain("https://*.liveblocks.io");
    expect(csp).toContain("wss://*.liveblocks.io");
  });

  it("does not allow eval or localhost in production", () => {
    const csp = get(prod, "Content-Security-Policy")!;
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("localhost");
  });

  it("allows eval and HMR only in development", () => {
    const csp = get(dev, "Content-Security-Policy")!;
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:*");
  });

  it("sends HSTS only in production", () => {
    expect(get(prod, "Strict-Transport-Security")).toContain("max-age=");
    expect(get(dev, "Strict-Transport-Security")).toBeUndefined();
  });

  it("never leaks the referrer and disables MIME sniffing", () => {
    expect(get(prod, "Referrer-Policy")).toBe("no-referrer");
    expect(get(prod, "X-Content-Type-Options")).toBe("nosniff");
  });
});
