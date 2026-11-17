import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  count?: number;
}

export const NavLink = ({ href, label, icon: Icon, isActive, count }: NavLinkProps) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "flex h-11 items-center gap-x-3 rounded-xl px-3 text-sm font-medium transition-colors",
      isActive
        ? "bg-lavender text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}
  >
    <Icon className="size-[18px] shrink-0" />
    <span className="flex-1 truncate">{label}</span>
    {count !== undefined && (
      <span className={cn("text-xs tabular-nums", isActive ? "text-primary" : "text-muted-foreground")}>
        {count}
      </span>
    )}
  </Link>
);
