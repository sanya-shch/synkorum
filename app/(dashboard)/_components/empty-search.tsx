import { SearchX } from "lucide-react";

import { EmptyState } from "./empty-state";

export const EmptySearch = () => (
  <EmptyState
    icon={SearchX}
    title="No results found!"
    description="Try searching for something else."
  />
);
