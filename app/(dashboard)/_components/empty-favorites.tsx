import { Star } from "lucide-react";

import { EmptyState } from "./empty-state";

export const EmptyFavorites = () => (
  <EmptyState
    icon={Star}
    title="No favorite boards!"
    description="Try adding a board to your favorites."
  />
);
