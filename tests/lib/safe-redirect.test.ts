import { describe, it, expect } from "vitest";
import { getSafeCallbackUrl } from "@/lib/safe-redirect";

describe("getSafeCallbackUrl", () => {
  it("keeps local paths, queries and hashes", () => {
    expect(getSafeCallbackUrl("/board/abc")).toBe("/board/abc");
    expect(getSafeCallbackUrl("/invite/xyz?a=1#h")).toBe("/invite/xyz?a=1#h");
  });

  it("falls back for empty values", () => {
    expect(getSafeCallbackUrl(null)).toBe("/");
    expect(getSafeCallbackUrl("")).toBe("/");
    expect(getSafeCallbackUrl(undefined, "/home")).toBe("/home");
  });

  it.each([
    "https://evil.com",
    "http://evil.com/x",
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "board/abc",
  ])("rejects %j", (value) => {
    expect(getSafeCallbackUrl(value)).toBe("/");
  });
});
