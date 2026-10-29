"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Poppins } from "next/font/google";

import { cn } from "@/lib/utils";
import { Actions } from "@/components/board-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRenameModal } from "@/store/use-rename-modal";

interface InfoProps {
  board: {
    id: string;
    title: string;
  };
}

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

const TabSeparator = () => {
  return <div className="text-neutral-300 px-1.5">|</div>;
};

export const Info = ({ board }: InfoProps) => {
  const { onOpen } = useRenameModal();

  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md">
      <Link href="/" className={cn(buttonVariants({ variant: "board" }), "px-2")}>
        <Image src="/logo.svg" alt="Board logo" height={24} width={24} />
        <span className={cn("font-semibold text-xl ml-2 text-black", font.className)}>
          Synkorum
        </span>
      </Link>

      <TabSeparator />

      <Button
        variant="board"
        className="text-base font-normal px-2 cursor-pointer"
        onClick={() => onOpen(board.id, board.title)}
      >
        {board.title}
      </Button>

      <TabSeparator />

      <Actions id={board.id} title={board.title} side="bottom" sideOffset={10}>
        <Button size="icon" variant="board" className="cursor-pointer">
          <Menu />
        </Button>
      </Actions>
    </div>
  );
};

export const InfoSkeleton = () => {
  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" />
  );
};
