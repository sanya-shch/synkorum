import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { currentUserMock } from "../mocks/current-user";

const { createDemoSessionMock, purgeMock, verifyTurnstileMock } = vi.hoisted(() => ({
  createDemoSessionMock: vi.fn(),
  purgeMock: vi.fn(),
  verifyTurnstileMock: vi.fn(),
}));

vi.mock("@/lib/demo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/demo")>()),
  createDemoSession: createDemoSessionMock,
  purgeExpiredDemos: purgeMock,
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: verifyTurnstileMock }));

import { DemoCapacityError } from "@/lib/demo";
import { POST } from "@/app/api/auth/demo/route";

let n = 0;
const startDemo = (body: unknown = { turnstileToken: "tok" }, ip = `10.9.0.${++n}`) =>
  POST(
    new Request("http://localhost/api/auth/demo", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  verifyTurnstileMock.mockReset().mockResolvedValue(true);
  purgeMock.mockReset().mockResolvedValue({ users: 0, organizations: 0, rooms: 0 });
  createDemoSessionMock
    .mockReset()
    .mockResolvedValue({ user: { id: "demo_1" }, board: { id: "b1" } });
});

afterEach(() => {
  delete process.env.DEMO_FALLBACK_URL;
});

describe("POST /api/auth/demo", () => {
  it("rejects a failed bot check before creating anything", async () => {
    verifyTurnstileMock.mockResolvedValue(false);

    const res = await startDemo();

    expect(res.status).toBe(400);
    expect(createDemoSessionMock).not.toHaveBeenCalled();
  });

  it("starts a demo: sets a session cookie that lasts 24 hours and points at the dashboard", async () => {
    const res = await startDemo();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ redirect: "/dashboard" });

    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("session=");
    expect(cookie).toContain("Max-Age=86400");
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  it("sweeps expired demos in the background after a successful start", async () => {
    await startDemo();
    await Promise.resolve();

    expect(purgeMock).toHaveBeenCalledTimes(1);
  });

  it("does not create a second demo for someone who is already signed in", async () => {
    currentUserMock.mockResolvedValue({ id: "u1" });

    const res = await startDemo();

    expect(await res.json()).toMatchObject({ redirect: "/dashboard" });
    expect(createDemoSessionMock).not.toHaveBeenCalled();
  });

  it("answers 503 with the read-only fallback when the demo is at capacity", async () => {
    process.env.DEMO_FALLBACK_URL = "https://example.com/board-link/abc";
    createDemoSessionMock.mockRejectedValue(new DemoCapacityError());

    const res = await startDemo();

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ fallbackUrl: "https://example.com/board-link/abc" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rate-limits one IP to 5 demo starts per hour", async () => {
    const ip = "10.99.0.1";
    for (let i = 0; i < 5; i++) expect((await startDemo(undefined, ip)).status).toBe(200);

    const res = await startDemo(undefined, ip);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });
});
