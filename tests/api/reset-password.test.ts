import { describe, it, expect } from "vitest";
import { prismaMock } from "../mocks/db";
import { POST } from "@/app/api/auth/reset-password/route";

const reset = (body: unknown) =>
  POST(
    new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/reset-password", () => {
  it("rejects an unknown or expired token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
    expect((await reset({ token: "nope", password: "longenough1" })).status).toBe(400);

    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "r1",
      email: "a@a.com",
      token: "t",
      expires: new Date(Date.now() - 1000),
    });
    expect((await reset({ token: "t", password: "longenough1" })).status).toBe(400);
  });

  it("sets the new password, burns the token and revokes older sessions", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "r1",
      email: "a@a.com",
      token: "t",
      expires: new Date(Date.now() + 60_000),
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "a@a.com" } as never);

    const res = await reset({ token: "t", password: "longenough1" });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { hashedPassword: expect.any(String), passwordChangedAt: expect.any(Date) },
    });
    expect(prismaMock.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
