import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

// Upstash Redis over HTTP (https://upstash.com - the free database needs no payment card).
// Returns null when it is not configured, and every caller then falls back to per-instance
// in-memory state: fine for local development, just not shared between serverless instances.
export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;

  return client;
}
