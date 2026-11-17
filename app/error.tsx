"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: send to real error tracking (Sentry, etc). Never render `error.message`
    // to the user here - it can be an unexpected/internal error (see lib/action-result.ts).
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-y-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        Please try again, or go back to the dashboard.
      </p>
      <div className="flex gap-x-2">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Link href="/dashboard" className={cn(buttonVariants())}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
