export type DashboardView = "overview" | "all" | "favorites" | "search";

interface DashboardQuery {
  search?: string;
  favorites?: string;
  view?: string;
}

// Which screen of the dashboard a query string maps to. A search always wins (it can
// be combined with the other filters), then favorites, then the explicit "all boards"
// listing; no params at all is the Overview.
export function getDashboardView(query: DashboardQuery): DashboardView {
  if (query.search) return "search";
  if (query.favorites) return "favorites";
  if (query.view === "all") return "all";
  return "overview";
}

export const DASHBOARD_VIEW_LABEL: Record<DashboardView, string> = {
  overview: "Overview",
  all: "All boards",
  favorites: "Favorites",
  search: "Search",
};

export const dashboardHref = (view: "overview" | "all" | "favorites") =>
  view === "overview"
    ? "/dashboard"
    : view === "all"
      ? "/dashboard?view=all"
      : "/dashboard?favorites=true";
