import { after } from "next/server";
import { logError } from "@/lib/logger";

// Runs `task` once the response has been sent (Next.js `after`), so housekeeping never makes
// a visitor wait. Failures are logged, never thrown.
export function runAfterResponse(name: string, task: () => Promise<unknown>) {
  const safe = () => task().catch((err) => logError(name, err));

  try {
    after(safe);
  } catch {
    // Not inside a request scope (e.g. unit tests): just fire and forget.
    void safe();
  }
}
