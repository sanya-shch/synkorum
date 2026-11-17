"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Layers, Plus, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateOrganizationModal } from "@/store/use-create-organization-modal";
import { useOrganizationSettingsModal } from "@/store/use-organization-settings-modal";
import { cn } from "@/lib/utils";

interface OrgSwitcherProps {
  organizations: { id: string; name: string }[];
  activeOrgId: string;
  className?: string;
}

export const OrgSwitcher = ({ organizations, activeOrgId, className }: OrgSwitcherProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const openCreateTeam = useCreateOrganizationModal((s) => s.onOpen);
  const openSettings = useOrganizationSettingsModal((s) => s.onOpen);

  const active = organizations.find((o) => o.id === activeOrgId);

  const switchTo = (id: string) => {
    if (id === activeOrgId || isPending) return;

    startTransition(async () => {
      await fetch("/api/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: id }),
      });
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full cursor-pointer items-center gap-x-3 rounded-2xl border bg-card p-2 text-left shadow-xs outline-none transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          isPending && "opacity-70",
          className,
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
          <Layers className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {active?.name ?? "Select a team"}
        </span>
        <ChevronsUpDown className="mr-1 size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your teams</DropdownMenuLabel>

          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchTo(org.id)}
              className="cursor-pointer gap-x-2.5 rounded-lg p-2"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-lavender text-xs font-semibold text-primary">
                {org.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              {org.id === activeOrgId && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {active && (
          <DropdownMenuItem
            onClick={() => openSettings(active.id)}
            className="cursor-pointer gap-x-2.5 rounded-lg p-2"
          >
            <Settings className="size-4" />
            Team settings
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={openCreateTeam}
          className="cursor-pointer gap-x-2.5 rounded-lg p-2"
        >
          <Plus className="size-4" />
          Create a team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
