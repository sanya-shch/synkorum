import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { signSessionToken, verifySessionToken } from "@/lib/jwt";

describe("session JWT", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSessionToken({ userId: "user_1" });
    const payload = await verifySessionToken(token);

    expect(payload).toEqual({ userId: "user_1", issuedAt: expect.any(Number) });
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken({ userId: "user_1" });
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");

    const payload = await verifySessionToken(tampered);

    expect(payload).toBeNull();
  });

  it("rejects garbage input instead of throwing", async () => {
    const payload = await verifySessionToken("not-a-jwt-at-all");

    expect(payload).toBeNull();
  });

  it("rejects a token with a forged signature", async () => {
    const token = await signSessionToken({ userId: "user_1" });
    const [header, payload] = token.split(".");
    const forged = `${header}.${payload}.forged-signature`;

    const result = await verifySessionToken(forged);

    expect(result).toBeNull();
  });

  it("rejects a token signed with a different algorithm", async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const token = await new SignJWT({ userId: "user_1" })
      .setProtectedHeader({ alg: "HS512" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    expect(await verifySessionToken(token)).toBeNull();
  });
});
