import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Primary call to action: sends signed-in visitors to the dashboard, everyone else to sign-up.
export const PrimaryCta = ({
  isLoggedIn,
  className,
  inverted,
}: {
  isLoggedIn: boolean;
  className?: string;
  inverted?: boolean;
}) => (
  <Link
    href={isLoggedIn ? "/dashboard" : "/register"}
    className={cn(
      "inline-flex h-12 items-center justify-center gap-x-2 rounded-xl px-6 text-[15px] font-medium transition",
      inverted
        ? "bg-white text-primary hover:bg-white/90"
        : "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90",
      className,
    )}
  >
    {isLoggedIn ? "Open dashboard" : "Get started"}
    <ArrowRight className="size-4" />
  </Link>
);
