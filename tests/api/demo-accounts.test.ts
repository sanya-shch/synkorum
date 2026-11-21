import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../mocks/db";
import { sendPasswordResetEmailMock } from "../mocks/mail";

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  burnPasswordCheck: vi.fn(),
}));

import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";

let n = 0;
const post = (handler: (r: Request) => Promise<Response>, path: string, body: unknown) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "x-forwarded-for": `10.7.0.${++n}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const demoUser = {
  id: "demo_1",
  email: "demo-1@demo.invalid",
  name: "Demo visitor",
  hashedPassword: "!",
  emailVerified: new Date(),
  isDemo: true,
} as never;

describe("demo accounts and the auth endpoints", () => {
  it("login answers a demo account exactly like an unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(demoUser);

    const res = await post(login, "/api/auth/login", {
      email: "demo-1@demo.invalid",
      password: "whatever1",
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Incorrect email or password" });
    expect(burnPasswordCheck).toHaveBeenCalled();
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("forgot-password gives the generic answer but never creates a token or mails a demo account", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(demoUser);

    const res = await post(forgotPassword, "/api/auth/forgot-password", {
      email: "demo-1@demo.invalid",
    });

    expect(res.status).toBe(200);
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });
});
