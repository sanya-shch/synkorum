import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { signSessionToken } from "@/lib/jwt";
import { proxy } from "@/proxy";

const call = (path: string, token?: string) =>
  proxy(
    new NextRequest(`http://localhost${path}`, {
      headers: token ? { cookie: `session=${token}` } : {},
    }),
  );

// A NextResponse.next() carries this header; a redirect carries `location`.
const passesThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";
const redirectTarget = (res: Response) => {
  const location = res.headers.get("location");
  return location ? new URL(location) : null;
};

describe("proxy - unauthenticated visitors", () => {
  it("redirects protected pages to /login with a callbackUrl", async () => {
    const target = redirectTarget(await call("/dashboard"));

    expect(target?.pathname).toBe("/login");
    expect(target?.searchParams.get("callbackUrl")).toBe("/dashboard");
  });

  it("keeps the dashboard query string in callbackUrl", async () => {
    const target = redirectTarget(await call("/dashboard?favorites=true"));

    expect(target?.searchParams.get("callbackUrl")).toBe("/dashboard?favorites=true");
  });

  it("keeps the path and query string in callbackUrl", async () => {
    const target = redirectTarget(await call("/settings?tab=members"));

    expect(target?.searchParams.get("callbackUrl")).toBe("/settings?tab=members");
  });

  it.each(["/", "/invalid-link", "/board/abc123", "/board-link/some-token", "/invite/some-token"])(
    "lets %s through",
    async (path) => {
      expect(passesThrough(await call(path))).toBe(true);
    },
  );

  it.each(["/boardroom", "/board-linkage", "/invitecode", "/invalid-link/extra"])(
    "does not treat the look-alike path %s as public",
    async (path) => {
      expect(redirectTarget(await call(path))?.pathname).toBe("/login");
    },
  );

  it.each(["/login", "/register", "/reset", "/new-password"])(
    "lets the auth page %s through",
    async (path) => {
      expect(passesThrough(await call(path))).toBe(true);
    },
  );

  it("does not gate /api/cron/* (they authenticate with CRON_SECRET themselves)", async () => {
    expect(passesThrough(await call("/api/cron/purge-demos"))).toBe(true);
  });

  it("does not gate /api/auth/* (login, register, ...)", async () => {
    expect(passesThrough(await call("/api/auth/login"))).toBe(true);
  });
});

describe("proxy - authenticated users", () => {
  it("lets them reach protected pages", async () => {
    const token = await signSessionToken({ userId: "u1" });

    expect(passesThrough(await call("/dashboard", token))).toBe(true);
  });

  it.each(["/login", "/register", "/reset", "/new-password"])(
    "redirects them away from %s to the dashboard",
    async (path) => {
      const token = await signSessionToken({ userId: "u1" });
      const target = redirectTarget(await call(path, token));

      expect(target?.pathname).toBe("/dashboard");
    },
  );
});

describe("proxy - invalid sessions are treated as logged out", () => {
  it("rejects a garbage token", async () => {
    const target = redirectTarget(await call("/dashboard", "not-a-jwt"));

    expect(target?.pathname).toBe("/login");
  });

  it("rejects a token signed with a different secret", async () => {
    const forged = await new SignJWT({ userId: "u1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode("some-other-secret"));

    expect(redirectTarget(await call("/dashboard", forged))?.pathname).toBe("/login");
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ userId: "u1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    expect(redirectTarget(await call("/dashboard", expired))?.pathname).toBe("/login");
  });

  it("still lets a visitor with a bad token open /login", async () => {
    expect(passesThrough(await call("/login", "not-a-jwt"))).toBe(true);
  });
});
