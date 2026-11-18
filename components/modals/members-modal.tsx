"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface Member {
  userId: string;
  role: "ADMIN" | "MEMBER";
  user: { name: string; email: string };
}

// Single instance, mounted by ModalProvider. Anything that wants to show the team
// (dashboard sidebar, Invite buttons, the board header) just calls useMembersModal().onOpen(orgId).
export const MembersModal = () => {
  const { isOpen, organizationId, onClose } = useMembersModal();

  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMembers = (orgId: string) => {
    startTransition(async () => {
      const result = await getOrganizationMembers(orgId);

      if (isActionError(result)) setMessage({ type: "error", text: result.error });
      else setMembers(result.members);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="h-9"
          />

          <div className="flex gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER")}>
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleInvite} disabled={isPending || !email} className="h-9">
              Invite
            </Button>
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{m.user.name}</div>
                <div className="truncate text-muted-foreground">{m.user.email}</div>
              </div>

              <div className="flex shrink-0 items-center gap-x-2">
                <Select
                  value={m.role}
                  onValueChange={(v) => handleRoleChange(m.userId, v as "ADMIN" | "MEMBER")}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => handleRemove(m.userId)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
