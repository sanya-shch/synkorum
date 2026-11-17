"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutDashboard, Settings, Star, Users } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { getDashboardView, dashboardHref } from "@/lib/dashboard-view";
import { useMembersModal } from "@/store/use-members-modal";
import { useOrganizationSettingsModal } from "@/store/use-organization-settings-modal";

import { NavLink } from "./nav-link";
import { OrgSwitcher } from "./org-switcher";
import { SidebarButton } from "./sidebar-button";
import { UserMenu } from "./user-menu";

export interface DashboardShellProps {
  organizations: { id: string; name: string }[];
  activeOrgId: string;
  counts: { boards: number; favorites: number; members: number };
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export const DashboardSidebar = ({
  organizations,
  activeOrgId,
  counts,
  user,
}: DashboardShellProps) => {
  const searchParams = useSearchParams();
  const view = getDashboardView({
    search: searchParams.get("search") ?? undefined,
    favorites: searchParams.get("favorites") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  });

  const openMembers = useMembersModal((s) => s.onOpen);
  const openSettings = useOrganizationSettingsModal((s) => s.onOpen);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-x-3 px-2">
        <LogoMark className="size-10 text-lg" />
        <span className="leading-tight">
          <span className="block text-lg font-semibold tracking-tight">Synkorum</span>
          <span className="block text-xs text-muted-foreground">Visual workspace</span>
        </span>
      </Link>

      <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} className="mt-7" />

      <nav className="mt-8 flex-1 space-y-8 overflow-y-auto">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-1">
            <NavLink
              href={dashboardHref("overview")}
              label="Overview"
              icon={LayoutDashboard}
              isActive={view === "overview" || view === "search"}
            />
            <NavLink
              href={dashboardHref("all")}
              label="All boards"
              icon={LayoutGrid}
              count={counts.boards}
              isActive={view === "all"}
            />
            <NavLink
              href={dashboardHref("favorites")}
              label="Favorites"
              icon={Star}
              count={counts.favorites}
              isActive={view === "favorites"}
            />
          </div>
        </div>

        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organization
          </p>
          <div className="space-y-1">
            <SidebarButton
              label="Members"
              icon={Users}
              count={counts.members}
              onClick={() => openMembers(activeOrgId)}
            />
            <SidebarButton
              label="Settings"
              icon={Settings}
              onClick={() => openSettings(activeOrgId)}
            />
          </div>
        </div>
      </nav>

      <div className="border-t pt-4">
        <UserMenu name={user.name} email={user.email} image={user.image} variant="card" />
      </div>
    </aside>
  );
};
