import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

// The "S" tile used across the landing page, dashboard and board header.
export const LogoMark = ({ className }: LogoMarkProps) => (
  <span
    aria-hidden
    className={cn(
      "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground shadow-sm shadow-primary/30",
      className,
    )}
  >
    S
  </span>
);
