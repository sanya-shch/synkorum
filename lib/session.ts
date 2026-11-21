import { signSessionToken } from "@/lib/jwt";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/constants";
import { DEMO_TTL_HOURS, DEMO_TTL_MS } from "@/lib/demo-config";

export async function buildSessionCookie(userId: string, { demo = false } = {}) {
  // A demo session never outlives its account: the JWT and the cookie both expire with it.
  const token = await signSessionToken({ userId }, demo ? `${DEMO_TTL_HOURS}h` : undefined);
  const options = demo
    ? { ...sessionCookieOptions, maxAge: Math.floor(DEMO_TTL_MS / 1000) }
    : sessionCookieOptions;

  return { name: SESSION_COOKIE, value: token, options };
}

export function clearSessionCookie() {
  return { name: SESSION_COOKIE, value: "", options: { ...sessionCookieOptions, maxAge: 0 } };
}
