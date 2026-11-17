import Link from "next/link";

import { getBoards } from "@/actions/board";
import { getDashboardView, dashboardHref } from "@/lib/dashboard-view";

import { BoardCard } from "./board-card";
import { EmptyBoards } from "./empty-boards";
import { EmptyFavorites } from "./empty-favorites";
import { EmptySearch } from "./empty-search";
import { NewBoardButton } from "./new-board-button";

type BoardRow = Awaited<ReturnType<typeof getBoards>>[number];

interface BoardListProps {
  organizationId: string;
  query: { search?: string; favorites?: string; view?: string };
}

const OVERVIEW_RECENT_LIMIT = 5; // + the "create" tile = two full rows of three

const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3";

const toCard = (board: BoardRow) => (
  <BoardCard
    key={board.id}
    id={board.id}
    title={board.title}
    authorName={board.authorName}
    createdAt={board.createdAt}
    isFavorite={board.favoritedBy.length > 0}
  />
);

const SectionHeader = ({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>

    {href && (
      <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
        View all
      </Link>
    )}
  </div>
);

export const BoardList = async ({ organizationId, query }: BoardListProps) => {
  const view = getDashboardView(query);
  const boards = await getBoards(organizationId, query);

  if (!boards.length && view === "search") return <EmptySearch />;
  if (!boards.length && view === "favorites") return <EmptyFavorites />;
  if (!boards.length) return <EmptyBoards organizationId={organizationId} />;

  if (view === "overview") {
    const favorites = boards.filter((b) => b.favoritedBy.length > 0);

    return (
      <div className="space-y-12">
        <section>
          <SectionHeader
            title="Favorites"
            description="Your most important canvases."
            href={favorites.length > 3 ? dashboardHref("favorites") : undefined}
          />

          {favorites.length ? (
            // Phones: a horizontal scroller. sm and up: a regular grid of up to three.
            <div className="-mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-3">
              {favorites.slice(0, 3).map((board) => (
                <div key={board.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
                  {toCard(board)}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed px-5 py-6 text-sm text-muted-foreground">
              Star a board and it will be pinned here for quick access.
            </p>
          )}
        </section>

        <section>
          <SectionHeader
            title="Recent boards"
            description="Pick up where you left off."
            href={boards.length > OVERVIEW_RECENT_LIMIT ? dashboardHref("all") : undefined}
          />

          <div className={`${gridClass} mt-6`}>
            <NewBoardButton organizationId={organizationId} />
            {boards.slice(0, OVERVIEW_RECENT_LIMIT).map(toCard)}
          </div>
        </section>
      </div>
    );
  }

  const title =
    view === "favorites" ? "Favorite boards" : view === "search" ? "Search results" : "All boards";
  const description =
    view === "favorites"
      ? "Boards you starred."
      : view === "search"
        ? `Boards matching “${query.search}”.`
        : "Every board in this team.";

  return (
    <section>
      <SectionHeader title={title} description={description} />

      <div className={`${gridClass} mt-6`}>
        {view === "all" && <NewBoardButton organizationId={organizationId} />}
        {boards.map(toCard)}
      </div>
    </section>
  );
};
