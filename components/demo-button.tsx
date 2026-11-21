"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

// Minimal typing for the parts of the Turnstile client API we use.
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      appearance?: "always" | "execute" | "interaction-only";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// "Try demo": starts a throwaway account on the server and drops the visitor on the
// dashboard. Guarded by an (invisible unless suspicious) Cloudflare Turnstile check.
export const DemoButton = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  // Without a site key (local dev) there is no widget to wait for.
  const [token, setToken] = useState<string | null>(null);
  const ready = !SITE_KEY || token !== null;

  const mountWidget = useCallback(() => {
    if (!SITE_KEY || !container.current || widgetId.current || !window.turnstile) return;

    widgetId.current = window.turnstile.render(container.current, {
      sitekey: SITE_KEY,
      appearance: "interaction-only",
      callback: setToken,
      "expired-callback": () => setToken(null),
      "error-callback": () => setToken(null),
    });
  }, []);

  useEffect(() => {
    mountWidget();

    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [mountWidget]);

  const start = () => {
    startTransition(async () => {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken: token }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallbackUrl: string | undefined = data.fallbackUrl;
        toast.error(data.error ?? "Could not start the demo.", {
          action: fallbackUrl
            ? { label: "View a read-only demo", onClick: () => window.open(fallbackUrl, "_blank") }
            : undefined,
        });

        // A Turnstile token is single-use: get a fresh one for the next attempt.
        setToken(null);
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
        return;
      }

      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <>
      {SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="lazyOnload"
          onReady={mountWidget}
        />
      )}

      <button
        type="button"
        onClick={start}
        disabled={!ready || isPending}
        className={cn(
          "inline-flex h-12 cursor-pointer items-center justify-center gap-x-2 rounded-xl border bg-card px-6 text-[15px] font-medium shadow-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70",
          className,
        )}
      >
        <Sparkles className="size-4 text-primary" />
        {isPending ? "Starting demo…" : "Try demo"}
      </button>

      <div ref={container} />
    </>
  );
};
