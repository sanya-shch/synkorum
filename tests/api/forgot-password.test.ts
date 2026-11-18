import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../mocks/db";
import { sendPasswordResetEmailMock } from "../mocks/mail";
import { POST } from "@/app/api/auth/forgot-password/route";

let n = 0;
const forgot = (body: unknown, ip = `10.1.0.${++n}`) =>
  POST(
    new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/auth/forgot-password", () => {
  it("returns 400 for an invalid email", async () => {
    expect((await forgot({ email: "nope" })).status).toBe(400);
  });

  it("returns the same generic response whether or not the user exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const missing = await forgot({ email: "ghost@a.com" });

    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", email: "a@a.com" } as never);
    prismaMock.passwordResetToken.create.mockResolvedValue({
      id: "r1",
      email: "a@a.com",
      token: "tok",
      expires: new Date(),
    });
    const existing = await forgot({ email: "a@a.com" });

    expect(missing.status).toBe(200);
    expect(existing.status).toBe(200);
    expect(await missing.json()).toEqual(await existing.json());
  });

  it("sends a reset email only for existing users", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    await forgot({ email: "ghost@a.com" });
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();

    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", email: "a@a.com" } as never);
    prismaMock.passwordResetToken.create.mockResolvedValue({
      id: "r1",
      email: "a@a.com",
      token: "tok",
      expires: new Date(),
    });
    await forgot({ email: "a@a.com" });
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith("a@a.com", "tok");
  });

  it("still returns the generic message if sending the email fails", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "a@a.com" } as never);
    prismaMock.passwordResetToken.create.mockResolvedValue({
      id: "r1",
      email: "a@a.com",
      token: "tok",
      expires: new Date(),
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendPasswordResetEmailMock.mockRejectedValue(new Error("smtp down"));

    expect((await forgot({ email: "a@a.com" })).status).toBe(200);
    expect(logSpy).toHaveBeenCalledWith("[forgot-password]", expect.any(Error));
    logSpy.mockRestore();
  });

  it("returns 429 after 3 attempts from one IP", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const ip = "203.0.113.77";

    for (let i = 0; i < 3; i++) expect((await forgot({ email: "a@a.com" }, ip)).status).toBe(200);

    expect((await forgot({ email: "a@a.com" }, ip)).status).toBe(429);
  });
});
