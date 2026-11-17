import Link from "next/link";

import { LogoMark } from "@/components/logo";

import type { DashboardShellProps } from "./dashboard-sidebar";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

// Tablet / phone replacement for the sidebar: brand + account on one row, team switcher below.
export const MobileHeader = ({
  organizations,
  activeOrgId,
  user,
}: Pick<DashboardShellProps, "organizations" | "activeOrgId" | "user">) => (
  <header className="border-b bg-background px-4 pb-3 pt-3 lg:hidden">
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-x-2.5">
        <LogoMark className="size-9" />
        <span className="text-lg font-semibold tracking-tight">Synkorum</span>
      </Link>

      <UserMenu name={user.name} email={user.email} image={user.image} />
    </div>

    <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} className="mt-3" />
  </header>
);
