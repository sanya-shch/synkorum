import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { buildSessionCookie } from "@/lib/session";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await request.json();
  const validated = LoginSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { email, password } = validated.data;

  // Per-account limit on top of the per-IP one, so a botnet can't brute-force a single account.
  const accountLimit = checkRateLimit(`login-email:${email.toLowerCase()}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!accountLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } },
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await burnPasswordCheck(password);
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  const passwordsMatch = await verifyPassword(password, user.hashedPassword);
  if (!passwordsMatch) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  if (!user.emailVerified) {
    const verificationToken = await generateVerificationToken(user.email);

    try {
      await sendVerificationEmail(verificationToken.email, verificationToken.token);
    } catch {
      return NextResponse.json(
        { error: "The verification email could not be sent. Please try again later." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: "Email not confirmed. A new confirmation email has been sent." },
      { status: 200 },
    );
  }

  const response = NextResponse.json({ success: "You are logged in" });
  const cookie = await buildSessionCookie(user.id);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
