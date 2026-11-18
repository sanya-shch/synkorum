"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createOrganization } from "@/actions/organization";
import { useCreateOrganizationModal } from "@/store/use-create-organization-modal";
import { cn } from "@/lib/utils";
import { isActionError } from "@/lib/action-result";

export const CreateOrganizationModal = () => {
  const router = useRouter();
  const { isOpen, onClose } = useCreateOrganizationModal();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setName("");
      setError(null);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOrganization({ name });

      if (isActionError(result)) {
        setError(result.error);
        return;
      }

      if ("organization" in result) {
        // immediately make the newly created org active
        await fetch("/api/organizations/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: result.organization.id }),
        });

        setName("");
        onClose();
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            autoFocus
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={isPending || !name}
            className={cn("w-full", !(isPending || !name) && "cursor-pointer")}
          >
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
