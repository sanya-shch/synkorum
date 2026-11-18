import { AppError } from "@/lib/errors";
import { logError } from "@/lib/logger";

// Server actions return either their own success payload or `{ error }`. Callers narrow
// with `"error" in result` - the success payloads never contain an `error` key, so the
// check is a real discriminator and no non-null assertions are needed afterwards.
export type ActionResult<T> = T | { error: string };

// The one way callers tell the two outcomes apart. A type guard (instead of `"error" in r`)
// because TypeScript normalizes literal return types, so success branches sometimes carry
// an optional `error?: undefined` and `in` can no longer narrow them.
export const isActionError = (result: unknown): result is { error: string } =>
  typeof result === "object" &&
  result !== null &&
  "error" in result &&
  typeof (result as { error: unknown }).error === "string";

export async function toActionResult<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) {
      // Expected, user-facing error - safe to show as-is.
      return { error: err.message };
    }

    // Unexpected error (DB, network, bug) - never leak its message to the client.
    logError("action", err);
    return { error: "Something went wrong. Please try again." };
  }
}
