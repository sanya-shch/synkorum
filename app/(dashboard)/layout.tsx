import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/current-user";
import { getActiveOrganization, getMyOrganizationsWithRole } from "@/lib/active-org";
import { LogoMark } from "@/components/logo";

import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DemoBanner } from "./_components/demo-banner";
import { MobileHeader } from "./_components/mobile-header";
import { MobileNav } from "./_components/mobile-nav";
import { Navbar } from "./_components/navbar";
import { NoOrganization } from "./_components/no-organization";
import { UserMenu } from "./_components/user-menu";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await requireAuth();
  const organization = await getActiveOrganization();
  const memberships = await getMyOrganizationsWithRole();
  const organizations = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
  }));

  const userInfo = { name: user.name, email: user.email, image: user.image };

  if (!organization) {
    return (
      <main className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-x-2.5">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">Synkorum</span>
          </Link>
          <UserMenu {...userInfo} />
        </header>

        <div className="flex flex-1 items-center justify-center">
          <NoOrganization />
        </div>
      </main>
    );
  }

  const [boards, favorites, members] = await Promise.all([
    db.board.count({ where: { organizationId: organization.id } }),
    db.boardFavorite.count({
      where: { userId: user.id, board: { organizationId: organization.id } },
    }),
    db.membership.count({ where: { organizationId: organization.id } }),
  ]);

  return (
    <div className="min-h-dvh lg:pl-64">
      {user.isDemo && <DemoBanner createdAt={user.createdAt} />}

      <DashboardSidebar
        organizations={organizations}
        activeOrgId={organization.id}
        counts={{ boards, favorites, members }}
        user={userInfo}
      />

      <MobileHeader organizations={organizations} activeOrgId={organization.id} user={userInfo} />

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 sm:px-6 lg:px-10 lg:pb-10">
        <Navbar organization={organization} />
        {children}
      </main>

      <MobileNav organizationId={organization.id} />
    </div>
  );
};

export default DashboardLayout;
