"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const TOP_ZONE = 80; // always visible near the top of the page
const MIN_DELTA = 8; // ignore jitter smaller than this (trackpads, momentum scroll)

// Common "headroom" behaviour: scrolling down tucks the header away to free up the
// screen, the first scroll up brings it straight back, and it never hides at the top
// of the page or while something inside it (e.g. the mobile menu) has focus.
export const HeaderShell = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;

      if (y < TOP_ZONE) {
        setHidden(false);
        lastY = y;
        return;
      }

      if (Math.abs(delta) < MIN_DELTA) return;
      lastY = y;

      const hasFocus = ref.current?.contains(document.activeElement);
      setHidden(delta > 0 && !hasFocus);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none",
        hidden && "-translate-y-full",
      )}
    >
      {children}
    </header>
  );
};
