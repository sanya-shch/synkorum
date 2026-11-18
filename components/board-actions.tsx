"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Link2, Pencil, Share2, Eye, Trash2 } from "lucide-react";

import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { useRenameModal } from "@/store/use-rename-modal";
import { deleteBoard } from "@/actions/board";
import { Button } from "@/components/ui/button";
import { useBoardLinks } from "@/hooks/use-board-links";
import { isActionError } from "@/lib/action-result";

interface ActionsProps {
  children: React.ReactElement;
  side?: MenuPrimitive.Positioner.Props["side"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  id: string;
  title: string;
}

export const Actions = ({ children, side, sideOffset, id, title }: ActionsProps) => {
  const router = useRouter();
  const { onOpen } = useRenameModal();
  const [deletePending, startTransition] = useTransition();
  const { pending: linkPending, onCopyLink, onCopyShareLink } = useBoardLinks(id);
  const pending = deletePending || linkPending;

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteBoard(id);

      if (isActionError(result)) {
        toast.error(result.error);
        return;
      }

      toast.success("Board deleted");

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children} />

      <DropdownMenuContent
        onClick={(e) => e.stopPropagation()}
        className="w-55"
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownMenuItem onClick={onCopyLink} className="p-3 cursor-pointer">
          <Link2 className="h-4 w-4 mr-2" />
          Copy board link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onCopyShareLink(true)}
          disabled={pending}
          className="p-3 cursor-pointer"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Copy anonymous share link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onCopyShareLink(false)}
          disabled={pending}
          className="p-3 cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          Copy read-only share link
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onOpen(id, title)} className="p-3 cursor-pointer">
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>

        <ConfirmModal
          header="Delete board?"
          description="This will delete the board and all of its contents."
          disabled={pending}
          onConfirm={onDelete}
        >
          <Button
            variant="ghost"
            className="p-3 cursor-pointer text-sm w-full h-full justify-start font-normal text-red-600 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
