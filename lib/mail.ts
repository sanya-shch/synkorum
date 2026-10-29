import { Resend } from "resend";
import { escapeHtml } from "@/lib/layer-text";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// В деві без верифікованого домену Resend дозволяє слати листи тільки на
// свою ж email-адресу, з якої зареєстровано акаунт Resend, з відправника
// "onboarding@resend.dev". Для продакшену - додайте і верифікуйте свій
// домен в Resend, і поставте EMAIL_FROM="Board <noreply@ваш-домен.com>".
const FROM = process.env.EMAIL_FROM || "Board <onboarding@resend.dev>";

async function send(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[mail] error:", error);
    throw new Error(error.message);
  }

  console.log("[mail] Email sent:", data);

  return data;
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
