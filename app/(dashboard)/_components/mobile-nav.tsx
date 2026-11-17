"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, LayoutGrid, Star, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { getDashboardView, dashboardHref } from "@/lib/dashboard-view";
import { useMembersModal } from "@/store/use-members-modal";

const tabClass = "flex flex-1 flex-col items-center gap-y-1 py-2.5 text-[11px] font-medium";

export const MobileNav = ({ organizationId }: { organizationId: string }) => {
  const searchParams = useSearchParams();
  const openMembers = useMembersModal((s) => s.onOpen);

  const view = getDashboardView({
    search: searchParams.get("search") ?? undefined,
    favorites: searchParams.get("favorites") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

  const tabs = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: dashboardHref("overview"),
      active: view === "overview" || view === "search",
    },
    { label: "Boards", icon: LayoutGrid, href: dashboardHref("all"), active: view === "all" },
    {
      label: "Favorites",
      icon: Star,
      href: dashboardHref("favorites"),
      active: view === "favorites",
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {tabs.map(({ label, icon: Icon, href, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(tabClass, active ? "text-primary" : "text-muted-foreground")}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}

      <button
        type="button"
        onClick={() => openMembers(organizationId)}
        className={cn(tabClass, "cursor-pointer text-muted-foreground")}
      >
        <Users className="size-5" />
        Team
      </button>
    </nav>
  );
};
