// Fixed-window rate limiter, keyed by IP + action name.
//
// With UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN set it is backed by Upstash Redis
// (@upstash/ratelimit), so the limit is shared by every serverless instance. Without them
// (local development) - or if Redis is unreachable - it falls back to an in-memory window
// that is per instance: still stops the crudest brute force, but can be sidestepped by
// spreading requests over instances. A Redis outage therefore degrades protection instead
// of locking everybody out of logging in.

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";
import { logError } from "@/lib/logger";

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

type RateLimitOptions = { limit: number; windowMs: number };
type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const limiters = new Map<string, Ratelimit>();

function getLimiter({ limit, windowMs }: RateLimitOptions): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const id = `${limit}:${windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: "synkorum:rl",
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

function checkInMemory(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
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

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const limiter = getLimiter(options);

  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(key);
      return {
        allowed: success,
        retryAfterSeconds: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (err) {
      logError("rate-limit", err);
    }
  }

  return checkInMemory(key, options);
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
