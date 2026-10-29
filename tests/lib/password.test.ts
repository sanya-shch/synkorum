import { describe, it, expect } from "vitest";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");

    await expect(verifyPassword("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time due to random salt", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);

    expect(a).not.toBe(b);
  });
});

describe("burnPasswordCheck", () => {
  it("resolves without a user and does not throw", async () => {
    await expect(burnPasswordCheck("anything")).resolves.toBeUndefined();
  });
});
