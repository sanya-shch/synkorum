import { escapeHtml } from "@/lib/layer-text";
import { logError } from "@/lib/logger";
import { isDemoEmail } from "@/lib/demo-config";

// Transactional email through Brevo's HTTP API (https://developers.brevo.com/reference/sendtransacemail).
// Plain fetch on purpose: one endpoint, no SDK dependency to ship to a serverless function.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// EMAIL_FROM is "Synkorum <noreply@your-domain.com>" or a bare address. Brevo only sends
// from a sender you have verified in its dashboard (Senders, Domains & Dedicated IPs).
function parseSender(raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return null;

  const match = value.match(/^(.*?)\s*<([^<>\s]+)>$/);
  if (match) return { name: match[1].replace(/^"|"$/g, "") || undefined, email: match[2] };
  return { email: value };
}

async function send(to: string, subject: string, html: string) {
  // Demo accounts have no mailbox (see lib/demo-config.ts). Nothing should ever try to mail
  // them, but if some path does, dropping it beats a bounce and a wasted quota slot.
  if (isDemoEmail(to)) return;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const sender = parseSender(process.env.EMAIL_FROM);
  if (!sender) {
    throw new Error('EMAIL_FROM is not set (expected e.g. "Synkorum <noreply@your-domain.com>")');
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const error = new Error(`Brevo responded with ${response.status}: ${details.slice(0, 300)}`);
    logError("mail", error);
    throw error;
  }
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  await send(email, "Confirm email", `<p>Confirm email: <a href="${link}">${link}</a></p>`);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const link = `${APP_URL}/new-password?token=${token}`;
  await send(email, "Password reset", `<p>Reset password: <a href="${link}">${link}</a></p>`);
};

export const sendOrgInviteEmail = async (params: {
  email: string;
  token: string;
  organizationName: string;
}) => {
  const link = `${APP_URL}/invite/${params.token}`;
  await send(
    params.email,
    `Invitation to the team "${params.organizationName}"`,
    `<p>You have been invited to the team "${escapeHtml(params.organizationName)}". <a href="${link}">Join</a></p>`,
  );
};
