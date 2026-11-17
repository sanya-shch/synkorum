import { Organization } from "@/generated/prisma/client";

import { Breadcrumbs } from "./breadcrumbs";
import { SearchInput } from "./search-input";
import { InviteButton } from "./invite-button";

interface NavbarProps {
  organization: Organization;
}

// One flex row on desktop (breadcrumbs, search, invite); on narrow screens the search
// wraps onto its own full-width row under the breadcrumbs / invite button.
export const Navbar = ({ organization }: NavbarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-5 lg:flex-nowrap lg:pt-7">
      <div className="order-1 min-w-0 flex-1">
        <Breadcrumbs organizationName={organization.name} />
      </div>

      <div className="order-3 w-full lg:order-2 lg:w-[360px]">
        <SearchInput />
      </div>

      <div className="order-2 lg:order-3">
        <InviteButton organizationId={organization.id} />
      </div>
    </div>
  );
};
