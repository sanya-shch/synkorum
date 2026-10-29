import { describe, it, expect } from "vitest";
import { isSessionRevoked } from "@/lib/session-validity";

const at = (iso: string) => new Date(iso);
const sec = (iso: string) => Math.floor(at(iso).getTime() / 1000);

describe("isSessionRevoked", () => {
  it("never revokes when the password was not changed", () => {
    expect(isSessionRevoked(sec("2026-01-01T00:00:00Z"), null)).toBe(false);
  });

  it("revokes a session issued before the password change", () => {
    expect(isSessionRevoked(sec("2026-01-01T00:00:00Z"), at("2026-01-02T00:00:00Z"))).toBe(true);
  });

  it("keeps a session issued after the password change", () => {
    expect(isSessionRevoked(sec("2026-01-03T00:00:00Z"), at("2026-01-02T00:00:00Z"))).toBe(false);
  });

  it("keeps a session issued within the same second as the change", () => {
    expect(isSessionRevoked(sec("2026-01-02T00:00:00Z"), at("2026-01-02T00:00:00.700Z"))).toBe(
      false,
    );
  });
});
