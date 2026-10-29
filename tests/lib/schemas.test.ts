import { describe, it, expect } from "vitest";
import { LoginSchema, NewPasswordSchema, RegisterSchema } from "@/schemas";

const reg = (password: string) =>
  RegisterSchema.safeParse({ name: "Ann", email: "ann@a.com", password });

describe("new password policy", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(reg("1234567").success).toBe(false);
    expect(NewPasswordSchema.safeParse({ password: "short" }).success).toBe(false);
  });

  it("accepts 8+ characters", () => {
    expect(reg("12345678").success).toBe(true);
  });

  it("rejects more than 72 bytes (bcrypt ignores the rest)", () => {
    expect(reg("a".repeat(72)).success).toBe(true);
    expect(reg("a".repeat(73)).success).toBe(false);
    // 40 two-byte characters = 80 bytes, although only 40 characters long.
    expect(reg("é".repeat(40)).success).toBe(false);
  });
});

describe("login password", () => {
  it("still accepts short legacy passwords", () => {
    expect(LoginSchema.safeParse({ email: "a@a.com", password: "abc123" }).success).toBe(true);
  });

  it("bounds the size", () => {
    expect(LoginSchema.safeParse({ email: "a@a.com", password: "a".repeat(257) }).success).toBe(
      false,
    );
  });
});
