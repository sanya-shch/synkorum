"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";

import {
  getOrganizationById,
  updateOrganization,
  leaveOrganization,
  deleteOrganization,
} from "@/actions/organization";
import { useOrganizationSettingsModal } from "@/store/use-organization-settings-modal";
import { cn } from "@/lib/utils";
import { isActionError } from "@/lib/action-result";

export const OrganizationSettingsModal = () => {
  const router = useRouter();
  const { isOpen, organizationId, onClose } = useOrganizationSettingsModal();

  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen || !organizationId) return;

    let cancelled = false;

    getOrganizationById(organizationId).then((result) => {
      if (cancelled) return;

      if (isActionError(result)) {
        setError(result.error);
      } else {
        setName(result.organization.name);
        setIsAdmin(result.role === "ADMIN");
      }
      setLoadedId(organizationId);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, organizationId]);

  const isLoading = loadedId !== organizationId;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setError(null);
    }
  };

  const onSave = () => {
    if (!organizationId) return;
    setError(null);

    startTransition(async () => {
      const result = await updateOrganization({ organizationId, name });
      if (isActionError(result)) setError(result.error);
      else router.refresh();
    });
  };

  const onLeave = () => {
    if (!organizationId) return;

    startTransition(async () => {
      const result = await leaveOrganization(organizationId);
      if (isActionError(result)) {
        setError(result.error);
        return;
      }
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!organizationId) return;

    startTransition(async () => {
      const result = await deleteOrganization(organizationId);
      if (isActionError(result)) {
        setError(result.error);
        return;
      }
      onClose();
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Team settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending || !isAdmin}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {isAdmin && (
                <Button
                  onClick={onSave}
                  disabled={isPending || !name}
                  size="sm"
                  className={cn(!(isPending || !name) && "cursor-pointer")}
                >
                  Save name
                </Button>
              )}
              {!isAdmin && (
                <p className="text-xs text-muted-foreground">
                  Only the team administrator can change the name
                </p>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-red-600">Danger zone</p>
              <ConfirmModal
                header="Leave the team?"
                description="You will lose access to this team's boards."
                disabled={isPending}
                onConfirm={onLeave}
              >
                <Button variant="outline" disabled={isPending} className="w-full cursor-pointer">
                  Leave the team
                </Button>
              </ConfirmModal>
              {isAdmin && (
                <ConfirmModal
                  header="Delete team permanently?"
                  description="All team boards will be lost forever."
                  disabled={isPending}
                  onConfirm={onDelete}
                >
                  <Button
                    variant="destructive"
                    disabled={isPending}
                    className="w-full cursor-pointer"
                  >
                    Delete team permanently
                  </Button>
                </ConfirmModal>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
