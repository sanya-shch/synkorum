"use client";

import { FormEventHandler, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogClose,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRenameModal } from "@/store/use-rename-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateBoardTitle } from "@/actions/board";
import { isActionError } from "@/lib/action-result";

const RenameForm = ({ id, initialTitle }: { id: string; initialTitle: string }) => {
  const router = useRouter();
  const { onClose } = useRenameModal();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateBoardTitle(id, title);

      if (isActionError(result)) {
        toast.error(result.error);
        return;
      }

      toast.success("Board renamed");
      onClose();

      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        disabled={pending}
        required
        maxLength={60}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Board title"
      />

      <DialogFooter>
        <DialogClose
          render={
            <Button type="button" variant="outline">
              Cancel
            </Button>
          }
        />

        <Button disabled={pending} type="submit">
          Save
        </Button>
      </DialogFooter>
    </form>
  );
};

export const RenameModal = () => {
  const { isOpen, onClose, initialValues } = useRenameModal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit board title</DialogTitle>
        </DialogHeader>

        <DialogDescription>Enter a new title for this board</DialogDescription>

        {/* key: a different board starts from its own title, no effect needed to sync it */}
        <RenameForm
          key={initialValues.id}
          id={initialValues.id}
          initialTitle={initialValues.title}
        />
      </DialogContent>
    </Dialog>
  );
};
