import { describe, it, expect } from "vitest";
import { getDashboardView, dashboardHref } from "@/lib/dashboard-view";

describe("getDashboardView", () => {
  it("defaults to the overview", () => {
    expect(getDashboardView({})).toBe("overview");
  });

  it("maps ?view=all to the full listing", () => {
    expect(getDashboardView({ view: "all" })).toBe("all");
  });

  it("ignores unknown view values", () => {
    expect(getDashboardView({ view: "nonsense" })).toBe("overview");
  });

  it("maps ?favorites to favorites", () => {
    expect(getDashboardView({ favorites: "true" })).toBe("favorites");
  });

  it("lets a search win over every other filter", () => {
    expect(getDashboardView({ search: "q", favorites: "true", view: "all" })).toBe("search");
  });

  it("treats an empty search as no search", () => {
    expect(getDashboardView({ search: "" })).toBe("overview");
  });
});

describe("dashboardHref", () => {
  it("round-trips through getDashboardView", () => {
    for (const view of ["overview", "all", "favorites"] as const) {
      const params = new URL(dashboardHref(view), "http://x").searchParams;
      expect(
        getDashboardView({
          favorites: params.get("favorites") ?? undefined,
          view: params.get("view") ?? undefined,
        }),
      ).toBe(view);
    }
  });
});
