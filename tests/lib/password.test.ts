import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { burnPasswordCheck, hashPassword, SALT_ROUNDS, verifyPassword } from "@/lib/password";
import { IS_FOR_PORTFOLIO } from "@/lib/portfolio";

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

describe("bcrypt cost", () => {
  it("uses the cheaper cost only in portfolio mode and stores it in the hash", async () => {
    expect(SALT_ROUNDS).toBe(IS_FOR_PORTFOLIO ? 10 : 12);

    const hash = await hashPassword("correct-horse-battery-staple");

    expect(bcrypt.getRounds(hash)).toBe(SALT_ROUNDS);
  });

  it("still verifies hashes created with the production cost", async () => {
    const productionHash = await bcrypt.hash("correct-horse-battery-staple", 12);

    await expect(verifyPassword("correct-horse-battery-staple", productionHash)).resolves.toBe(
      true,
    );
  });
});

describe("burnPasswordCheck", () => {
  it("resolves without a user and does not throw", async () => {
    await expect(burnPasswordCheck("anything")).resolves.toBeUndefined();
  });
});
