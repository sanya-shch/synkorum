import { logError } from "@/lib/logger";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResetSchema } from "@/schemas";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const GENERIC_MESSAGE = "If such an email is registered, a letter has been sent to it";

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`forgot-password:${getClientIp(request)}`, {
    limit: 3,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await request.json();
  const validated = ResetSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { email } = validated.data;
  const user = await db.user.findUnique({ where: { email } });

  // Demo accounts have no real mailbox - never generate a token or send mail for them.
  if (user && !user.isDemo) {
    const resetToken = await generatePasswordResetToken(email);

    try {
      await sendPasswordResetEmail(resetToken.email, resetToken.token);
    } catch (err) {
      // The response stays generic (no account enumeration); only the log shows the failure.
      logError("forgot-password", err);
    }
  }

  return NextResponse.json({ success: GENERIC_MESSAGE });
}
