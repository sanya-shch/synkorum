"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthMessage } from "@/components/auth/auth-form";
import {
  MemberAvatar,
  ModalHeading,
  modalButtonClass,
  modalCloseClass,
  modalContentClass,
  modalFieldClass,
  softDangerClass,
} from "@/components/modals/modal-parts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { inviteMemberByEmail } from "@/actions/invite";
import { getOrganizationMembers, removeMember, changeMemberRole } from "@/actions/organization";
import { useMembersModal } from "@/store/use-members-modal";
import { isActionError } from "@/lib/action-result";
import { cn } from "@/lib/utils";

interface Member {
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: { name: string; email: string; image?: string | null };
}

const ROLE_LABEL = { ADMIN: "Admin", MEMBER: "Member" } as const;

// Single instance, mounted by ModalProvider. Anything that wants to show the team
// (dashboard sidebar, Invite buttons, the board header) just calls useMembersModal().onOpen(orgId).
export const MembersModal = () => {
  const { isOpen, organizationId, onClose } = useMembersModal();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMembers = (orgId: string) => {
    startTransition(async () => {
      const result = await getOrganizationMembers(orgId);

      if (isActionError(result)) setMessage({ type: "error", text: result.error });
      else {
        setMembers(result.members);
        setCurrentUserId(result.currentUserId);
      }
    });
  };

  useEffect(() => {
    if (!isOpen || !organizationId) return;
    loadMembers(organizationId);
  }, [isOpen, organizationId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setEmail("");
      setMessage(null);
    }
  };

  const handleInvite = () => {
    if (!organizationId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await inviteMemberByEmail({ organizationId, email, role });
      if (isActionError(result)) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.success });
        setEmail("");
      }
    });
  };

  const handleRemove = (userId: string) => {
    if (!organizationId) return;
    startTransition(async () => {
      const result = await removeMember(organizationId, userId);

      if (isActionError(result)) setMessage({ type: "error", text: result.error });
      else loadMembers(organizationId);
    });
  };

  const handleRoleChange = (userId: string, newRole: "ADMIN" | "MEMBER") => {
    if (!organizationId) return;
    startTransition(async () => {
      const result = await changeMemberRole(organizationId, userId, newRole);

      if (isActionError(result)) setMessage({ type: "error", text: result.error });
      else loadMembers(organizationId);
    });
  };

  // Only admins can invite and manage people (the server enforces it too); everyone else
  // just sees who is on the team.
  const isAdmin = members.some((m) => m.userId === currentUserId && m.role === "ADMIN");

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(modalContentClass, "sm:max-w-[560px]")}
        closeClassName={modalCloseClass}
      >
        <ModalHeading
          title="Team members"
          description="Invite teammates and manage workspace access."
        />

        {isAdmin && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="email@example.com"
              aria-label="Email address to invite"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className={cn(modalFieldClass, "min-w-0 flex-1")}
            />

            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}>
              <SelectTrigger
                aria-label="Role of the invited person"
                className={cn(modalFieldClass, "sm:w-36")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleInvite}
              disabled={isPending || !email}
              className={modalButtonClass}
            >
              Invite
            </Button>
          </div>
        )}

        {message && <AuthMessage type={message.type}>{message.text}</AuthMessage>}

        <ul className={cn("max-h-[min(50vh,22rem)] overflow-y-auto", isAdmin && "border-t pt-2")}>
          {members.map((m) => {
            const isSelf = m.userId === currentUserId;
            const canManage = isAdmin && !isSelf;

            return (
              <li key={m.userId} className="flex items-center gap-x-4 py-3">
                <MemberAvatar name={m.user.name} image={m.user.image} />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold">
                    {m.user.name}
                    {isSelf && <span className="font-normal text-muted-foreground"> (you)</span>}
                  </div>
                  <div className="truncate text-[15px] text-muted-foreground">{m.user.email}</div>
                </div>

                {canManage ? (
                  <div className="flex shrink-0 items-center gap-x-2">
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.userId, v as "ADMIN" | "MEMBER")}
                      disabled={isPending}
                    >
                      <SelectTrigger
                        aria-label={`Role of ${m.user.name}`}
                        className="h-11 w-28 rounded-xl bg-background px-3.5 text-[15px] sm:w-32"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleRemove(m.userId)}
                      className={cn(softDangerClass, "h-11 px-4 text-[15px] hover:text-foreground")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-full bg-lavender px-3 py-1 text-sm font-medium text-primary">
                    {ROLE_LABEL[m.role]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
