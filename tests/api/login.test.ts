import { describe, it, expect, vi } from "vitest";
import { prismaMock } from "../mocks/db";
import { sendVerificationEmailMock } from "../mocks/mail";

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  burnPasswordCheck: vi.fn(),
}));

import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { POST } from "@/app/api/auth/login/route";

let n = 0;
const login = (body: unknown, ip = `10.0.0.${++n}`) =>
  POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const user = (overrides = {}) =>
  ({
    id: "u1",
    email: "a@a.com",
    name: "A",
    hashedPassword: "hash",
    emailVerified: new Date(),
    ...overrides,
  }) as never;

const valid = { email: "a@a.com", password: "secret123" };

describe("POST /api/auth/login", () => {
  it("returns 400 for invalid form data", async () => {
    const res = await login({ email: "not-an-email", password: "" });
    expect(res.status).toBe(400);
  });

  it("returns the same 401 message for unknown email and wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const unknown = await login(valid);

    prismaMock.user.findUnique.mockResolvedValueOnce(user());
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    const wrong = await login(valid);

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrong.json());
  });

  it("sends a new verification email when the email is not verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user({ emailVerified: null }));
    vi.mocked(verifyPassword).mockResolvedValue(true);
    prismaMock.verificationToken.create.mockResolvedValue({
      id: "t1",
      email: "a@a.com",
      token: "tok",
      expires: new Date(),
    });

    const res = await login(valid);

    expect(res.status).toBe(200);
    expect(sendVerificationEmailMock).toHaveBeenCalledWith("a@a.com", "tok");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 502 when the verification email fails to send", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user({ emailVerified: null }));
    vi.mocked(verifyPassword).mockResolvedValue(true);
    prismaMock.verificationToken.create.mockResolvedValue({
      id: "t1",
      email: "a@a.com",
      token: "tok",
      expires: new Date(),
    });
    sendVerificationEmailMock.mockRejectedValue(new Error("smtp down"));

    const res = await login(valid);
    expect(res.status).toBe(502);
  });

  it("sets an httpOnly session cookie on successful login", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user());
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await login(valid);
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(res.status).toBe(200);
    expect(cookie).toContain("session=");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("returns 429 with Retry-After after 5 attempts from one IP", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const ip = "203.0.113.9";

    for (let i = 0; i < 5; i++) expect((await login(valid, ip)).status).toBe(401);
    const blocked = await login(valid, ip);

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(5);
  });

  it("does not rate limit a different IP", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    for (let i = 0; i < 6; i++) await login(valid, "203.0.113.50");

    expect((await login(valid, "203.0.113.51")).status).toBe(401);
  });
});

describe("POST /api/auth/login - per-account limit", () => {
  it("locks an account out after 10 attempts even when the IP changes", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await login({ email: "victim@a.com", password: "guess" + i })).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("still spends password-hashing time when the email is unknown", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await login({ email: "ghost@a.com", password: "whatever1" });

    expect(burnPasswordCheck).toHaveBeenCalledWith("whatever1");
  });
});
