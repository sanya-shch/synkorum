import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { hashPassword } from "@/lib/password";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { runAfterResponse } from "@/lib/after-response";
import { emailBudgetAvailable, EmailBudgetError, EMAIL_BUDGET_MESSAGE } from "@/lib/email-budget";
import { runHousekeeping } from "@/lib/housekeeping";
import { VERIFICATION_WINDOW_HOURS } from "@/lib/unverified";

function isUniqueConstraintError(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`register:${getClientIp(request)}`, {
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
  const validated = RegisterSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { name, email, password, inviteToken } = validated.data;

  // Refuse before creating anything: an account whose confirmation email can't go out would
  // just sit there unusable.
  if (!(await emailBudgetAvailable())) {
    return NextResponse.json({ error: EMAIL_BUDGET_MESSAGE }, { status: 503 });
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  let invite = null;
  if (inviteToken) {
    invite = await db.invite.findUnique({ where: { token: inviteToken } });

    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "The invitation is invalid or expired" }, { status: 400 });
    }
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was issued to a different email address" },
        { status: 400 },
      );
    }
  }

  const hashedPassword = await hashPassword(password);

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, hashedPassword },
      });

      if (invite) {
        await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: invite.organizationId,
            role: invite.role,
          },
        });
        await tx.invite.delete({ where: { id: invite.id } });
      } else {
        const orgName = `${name}'s Team`;
        const slug = `${slugify(orgName)}-${user.id.slice(0, 6)}`;

        const organization = await tx.organization.create({
          data: { name: orgName, slug },
        });

        await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: "ADMIN",
          },
        });
      }

      return user;
    });
  } catch (err) {
    // Two simultaneous signups with the same email can both pass the check above;
    // the unique constraint then rejects the loser. Report it as a normal duplicate.
    if (isUniqueConstraintError(err) && (await db.user.findUnique({ where: { email } }))) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    throw err;
  }

  const verificationToken = await generateVerificationToken(email);

  try {
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof EmailBudgetError
            ? `${EMAIL_BUDGET_MESSAGE} Your account is saved - log in tomorrow and we will send the confirmation email then.`
            : "The account was created, but the email was not sent. Try logging in later - we will send a new email automatically.",
      },
      { status: err instanceof EmailBudgetError ? 503 : 502 },
    );
  }

  // Sweep abandoned sign-ups (and expired demos) after the response.
  runAfterResponse("housekeeping", () => runHousekeeping({ limit: 25 }));

  return NextResponse.json({
    success: `Check your email to confirm your account. Unconfirmed accounts are deleted after ${VERIFICATION_WINDOW_HOURS} hours.`,
  });
}
