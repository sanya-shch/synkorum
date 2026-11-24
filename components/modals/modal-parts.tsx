import { CircleAlert } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Look shared by the team modals (members, settings): a large rounded card with generous
// padding, a big title with a one-line description, tall rounded fields and buttons.

export const modalContentClass = "gap-6 rounded-3xl p-8 shadow-xl sm:max-w-[520px]";

// Larger, plainer X than the default, aligned with the title.
export const modalCloseClass =
  "top-7 right-7 size-9 rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-5";

// Input / select trigger / button heights, so a row of them lines up.
export const modalFieldClass = "h-12 rounded-xl bg-background px-4 text-[15px]";
export const modalButtonClass = "h-12 cursor-pointer rounded-xl px-6 text-[15px] font-semibold";

// The soft red surface used for "Remove" and "Delete team permanently".
export const softDangerClass =
  "cursor-pointer rounded-xl bg-red-100/70 font-medium text-foreground hover:bg-red-100";

export const ModalHeading = ({ title, description }: { title: string; description: string }) => (
  <DialogHeader className="gap-1.5 pr-12">
    <DialogTitle className="text-2xl font-bold tracking-tight">{title}</DialogTitle>
    <DialogDescription className="text-[15px] text-muted-foreground">
      {description}
    </DialogDescription>
  </DialogHeader>
);

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

export const MemberAvatar = ({ name, image }: { name: string; image?: string | null }) => (
  <Avatar className="size-10">
    {image && <AvatarImage src={image} alt="" />}
    <AvatarFallback className="bg-lavender text-sm font-semibold text-primary">
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);

export const DangerZoneHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-center gap-x-2 text-xl font-semibold text-red-600">
    <CircleAlert aria-hidden className="size-5" />
    {children}
  </p>
);
