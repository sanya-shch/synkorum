"use client";

import type { LucideIcon } from "lucide-react";

interface SidebarButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  count?: number;
}

// Same look as NavLink, for entries that open a modal instead of navigating.
export const SidebarButton = ({ label, icon: Icon, onClick, count }: SidebarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-11 w-full cursor-pointer items-center gap-x-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    <Icon className="size-[18px] shrink-0" />
    <span className="flex-1 truncate text-left">{label}</span>
    {count !== undefined && <span className="text-xs tabular-nums">{count}</span>}
  </button>
);
