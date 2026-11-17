"use client";

import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { DASHBOARD_VIEW_LABEL, getDashboardView } from "@/lib/dashboard-view";

export const Breadcrumbs = ({ organizationName }: { organizationName: string }) => {
  const searchParams = useSearchParams();
  const view = getDashboardView({
    search: searchParams.get("search") ?? undefined,
    favorites: searchParams.get("favorites") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-x-2 text-sm">
      <span className="truncate text-muted-foreground">{organizationName}</span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-medium">{DASHBOARD_VIEW_LABEL[view]}</span>
    </nav>
  );
};
