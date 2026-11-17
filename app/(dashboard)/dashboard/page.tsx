import { getActiveOrganization } from "@/lib/active-org";
import { requireAuth } from "@/lib/current-user";
import { getDashboardView } from "@/lib/dashboard-view";

import { BoardList } from "../_components/board-list";
import { CreateBoardButton } from "../_components/create-board-button";
import { Greeting } from "../_components/greeting";

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string;
    favorites?: string;
    view?: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const organization = await getActiveOrganization();

  if (!organization) return null;

  const user = await requireAuth();
  const query = await searchParams;
  const view = getDashboardView(query);
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="pb-10 pt-8 lg:pt-10">
      {view === "overview" && (
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <Greeting name={firstName} />
            <p className="mt-2 text-muted-foreground">
              Your team&apos;s ideas, organized in one place.
            </p>
          </div>

          <CreateBoardButton organizationId={organization.id} />
        </div>
      )}

      <BoardList organizationId={organization.id} query={query} />
    </div>
  );
};

export default DashboardPage;
