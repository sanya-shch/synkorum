"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { AuthMessage } from "@/components/auth/auth-form";
import {
  DangerZoneHeading,
  ModalHeading,
  modalCloseClass,
  modalContentClass,
  modalFieldClass,
  softDangerClass,
} from "@/components/modals/modal-parts";

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
      <DialogContent className={modalContentClass} closeClassName={modalCloseClass}>
        <ModalHeading title="Team settings" description="Manage your workspace name and access." />

        {isLoading ? (
          <p className="text-[15px] text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Input
                aria-label="Team name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending || !isAdmin}
                className={modalFieldClass}
              />
              {error && <AuthMessage type="error">{error}</AuthMessage>}
              {isAdmin ? (
                <Button
                  onClick={onSave}
                  disabled={isPending || !name}
                  className="h-11 cursor-pointer rounded-xl px-5 text-[15px] font-semibold"
                >
                  Save name
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only the team administrator can change the name
                </p>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="space-y-1.5">
                <DangerZoneHeading>Danger zone</DangerZoneHeading>
                <p className="text-[15px] text-muted-foreground">
                  Irreversible actions for this organization.
                </p>
              </div>

              <div className="space-y-3">
                <ConfirmModal
                  header="Leave the team?"
                  description="You will lose access to this team's boards."
                  disabled={isPending}
                  onConfirm={onLeave}
                >
                  <Button
                    variant="outline"
                    disabled={isPending}
                    className="h-12 w-full cursor-pointer rounded-xl bg-background text-[15px] font-medium"
                  >
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
                      variant="ghost"
                      disabled={isPending}
                      className={cn(
                        softDangerClass,
                        "h-12 w-full text-[15px] hover:text-foreground",
                      )}
                    >
                      Delete team permanently
                    </Button>
                  </ConfirmModal>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
