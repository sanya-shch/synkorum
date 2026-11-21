import crypto from "crypto";
import { NextResponse } from "next/server";
import { purgeExpiredDemos } from "@/lib/demo";

// Called by Vercel Cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`
// automatically when the CRON_SECRET environment variable is set. Without it the endpoint
// refuses everything, so it can never be triggered anonymously.
const isAuthorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) return new Response("Unauthorized", { status: 401 });

  return NextResponse.json(await purgeExpiredDemos({ limit: 500 }));
}
