"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMembersModal } from "@/store/use-members-modal";

interface InviteButtonProps {
  organizationId: string;
}

export const InviteButton = ({ organizationId }: InviteButtonProps) => {
  const onOpen = useMembersModal((s) => s.onOpen);

  return (
    <Button
      variant="outline"
      onClick={() => onOpen(organizationId)}
      className="h-11 cursor-pointer gap-x-2 rounded-xl bg-card px-4 text-sm shadow-xs"
    >
      <UserPlus className="size-4" />
      Invite
    </Button>
  );
};
