// Simple in-memory fixed-window rate limiter, keyed by IP + action name.
//
// Good enough for a single-instance deployment / to stop the crudest brute-force
// and email-bombing attempts. It does NOT share state across serverless instances -
// for real production traffic on Vercel/serverless, swap this for @upstash/ratelimit
// (Redis-backed) using the same checkRateLimit(key) call signature.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this doesn't grow forever on a long-lived process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
).unref?.();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// Number of trusted reverse proxies in front of the app (each one appends to
// X-Forwarded-For). Vercel and most single-proxy setups: 1. Set TRUSTED_PROXY_COUNT if
// there are more (e.g. CDN + load balancer = 2).
function trustedProxyCount() {
  const parsed = Number.parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

// X-Forwarded-For is "client, proxy1, proxy2". The client can put anything it likes at the
// START of the list, but entries appended by our own proxies are trustworthy - so count
// from the END, skipping the trusted proxies, instead of taking the first value.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[Math.max(0, parts.length - trustedProxyCount())];
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function resetRateLimits() {
  buckets.clear();
}
