import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { acceptOrgInvite } from "@/actions/invite";
import { setActiveOrganizationCookie } from "@/lib/active-org";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/invalid-link", request.url));
  }

  const user = await getCurrentUser();

  if (!user) {
    const existingUser = await db.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=/invite/${token}`, request.url));
    }

    return NextResponse.redirect(
      new URL(
        `/register?inviteToken=${token}&email=${encodeURIComponent(invite.email)}`,
        request.url,
      ),
    );
  }

  const result = await acceptOrgInvite(token);

  if ("error" in result || !result?.organizationId) {
    return NextResponse.redirect(new URL("/invalid-link", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  const cookie = setActiveOrganizationCookie(result.organizationId);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
