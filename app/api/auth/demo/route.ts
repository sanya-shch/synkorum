import { after, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { createDemoSession, DemoCapacityError, purgeExpiredDemos } from "@/lib/demo";
import { logError } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { buildSessionCookie } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";
import { DASHBOARD_PATH } from "@/routes";

// Sweeping expired demos after the response means visitors never wait for it, and the
// weekly cron (app/api/cron/purge-demos) only has to catch what this missed.
function runAfterResponse(task: () => Promise<unknown>) {
  const safe = () => task().catch((err) => logError("demo-purge", err));
  try {
    after(safe);
  } catch {
    // Not inside a request scope (e.g. unit tests): just fire and forget.
    void safe();
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { allowed, retryAfterSeconds } = checkRateLimit(`demo:${ip}`, {
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many demo sessions from your network. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  // Someone with a live session (demo or real) just goes to their dashboard.
  if (await getCurrentUser()) {
    return NextResponse.json({ success: "Already signed in", redirect: DASHBOARD_PATH });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined;

  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json(
      { error: "Bot check failed. Please reload the page and try again." },
      { status: 400 },
    );
  }

  try {
    const { user } = await createDemoSession();

    const response = NextResponse.json({ success: "Demo started", redirect: DASHBOARD_PATH });
    const cookie = await buildSessionCookie(user.id, { demo: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    runAfterResponse(() => purgeExpiredDemos({ limit: 25 }));
    return response;
  } catch (err) {
    if (err instanceof DemoCapacityError) {
      // DEMO_FALLBACK_URL: a view-only share link to a showcase board you own, so a visitor
      // can still see the product when the live demo is full.
      return NextResponse.json(
        { error: err.message, fallbackUrl: process.env.DEMO_FALLBACK_URL || null },
        { status: 503 },
      );
    }

    logError("demo-start", err);
    return NextResponse.json({ error: "Could not start the demo." }, { status: 500 });
  }
}
