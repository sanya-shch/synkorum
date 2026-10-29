import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/jwt";
import { isSessionRevoked } from "@/lib/session-validity";
import { SESSION_COOKIE } from "@/lib/constants";
import { AppError } from "./errors";

// Returns the user from the active session, or null. Intentionally rereads the user
// from the DB (and does not trust only the JWT payload) - so the email/name in the UI
// is always fresh, and banning/deleting the account immediately "turns off" the session.
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.emailVerified) return null;
  if (isSessionRevoked(payload.issuedAt, user.passwordChangedAt)) return null;

  return user;
}
// For Server Components / Server Actions - throws if the user is not logged in.
// Catch this error and show the fallback UI - the caller's responsibility, or let it go (Next will show the error boundary).
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("Unauthorized", 401);
  return user;
}

export const requireUser = requireAuth;
