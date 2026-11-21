import { logError } from "@/lib/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Verifies a Cloudflare Turnstile token (https://developers.cloudflare.com/turnstile/).
//
// Without TURNSTILE_SECRET_KEY the check is skipped outside production, so local development
// and tests need no Cloudflare account - but it FAILS CLOSED in production, so a missing
// variable can never silently turn the bot check off.
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      logError("turnstile", new Error("TURNSTILE_SECRET_KEY is not set"));
      return false;
    }
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (err) {
    logError("turnstile", err);
    return false;
  }
}
