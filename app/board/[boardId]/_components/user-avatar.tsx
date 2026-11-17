import { Hint } from "@/components/hint";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  name?: string;
  fallback?: string;
  borderColor?: string;
}

export const UserAvatar = ({ src, name, fallback, borderColor }: UserAvatarProps) => {
  return (
    <Hint label={name || "Teammate"} side="bottom" sideOffset={18}>
      <Avatar className="size-9 border-2 bg-white" style={{ borderColor: borderColor ?? "var(--lavender)" }}>
        <AvatarImage src={src} />
        <AvatarFallback className="bg-lavender text-xs font-semibold text-primary">{fallback}</AvatarFallback>
      </Avatar>
    </Hint>
  );
};
