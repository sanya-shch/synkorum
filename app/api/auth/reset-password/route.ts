import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NewPasswordSchema } from "@/schemas";
import { hashPassword } from "@/lib/password";
import * as z from "zod";

const RequestSchema = NewPasswordSchema.extend({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = RequestSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const { token, password } = validated.data;

  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expires < new Date()) {
    return NextResponse.json({ error: "The link is invalid or expired" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: resetToken.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { hashedPassword, passwordChangedAt: new Date() } }),
    db.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  return NextResponse.json({ success: "Password changed, now you can log in" });
}
