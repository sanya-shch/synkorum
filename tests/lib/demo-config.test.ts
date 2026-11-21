import { describe, it, expect } from "vitest";
import { DEMO_TTL_MS, demoExpiresAt, isDemoEmail, isDemoExpired } from "@/lib/demo-config";

const createdAt = new Date("2026-11-20T10:00:00Z");

describe("isDemoExpired", () => {
  it("is false for a regular account no matter how old it is", () => {
    const old = new Date("2020-01-01T00:00:00Z");
    expect(isDemoExpired({ isDemo: false, createdAt: old })).toBe(false);
  });

  it("is false for a demo account inside its 24h window", () => {
    const now = new Date(createdAt.getTime() + DEMO_TTL_MS - 1);
    expect(isDemoExpired({ isDemo: true, createdAt }, now)).toBe(false);
  });

  it("is true from the exact moment the window ends", () => {
    const now = new Date(createdAt.getTime() + DEMO_TTL_MS);
    expect(isDemoExpired({ isDemo: true, createdAt }, now)).toBe(true);
  });
});

describe("demo helpers", () => {
  it("computes the expiry from the creation time", () => {
    expect(demoExpiresAt(createdAt).getTime()).toBe(createdAt.getTime() + DEMO_TTL_MS);
  });

  it("recognises demo addresses case-insensitively and nothing else", () => {
    expect(isDemoEmail("demo-1@demo.invalid")).toBe(true);
    expect(isDemoEmail("DEMO-1@DEMO.INVALID")).toBe(true);
    expect(isDemoEmail("a@a.com")).toBe(false);
    expect(isDemoEmail("a@notdemo.invalid.com")).toBe(false);
  });
});
