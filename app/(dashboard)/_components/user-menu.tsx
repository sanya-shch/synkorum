"use client";

import { useRouter } from "next/navigation";
import { LogOut, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  // "card": avatar + name + email (sidebar footer). "avatar": avatar only (mobile header).
  variant?: "card" | "avatar";
}

export const UserMenu = ({ name, email, image, variant = "avatar" }: UserMenuProps) => {
  const router = useRouter();

  const initials = (name ?? email ?? "?").slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const avatar = (
    <Avatar className={variant === "card" ? "size-10" : "size-9"}>
      {image && <AvatarImage src={image} alt={name ?? "User"} />}
      <AvatarFallback className="bg-lavender font-semibold text-primary">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "card"
            ? "flex w-full items-center gap-x-3 rounded-xl p-2 text-left transition hover:bg-muted"
            : "rounded-full",
        )}
      >
        {avatar}

        {variant === "card" && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
            <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={variant === "card" ? "start" : "end"}
        side={variant === "card" ? "top" : "bottom"}
        className="w-56 rounded-xl p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {name}
            <div className="truncate text-xs font-normal text-muted-foreground">{email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer gap-x-2 rounded-lg" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
