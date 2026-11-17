import { cn } from "@/lib/utils";

// Boards live in Liveblocks, so there is no stored preview image to show. Each card
// gets one of three tinted placeholders (picked from the id so it stays stable).
const VARIANTS = ["lavender", "periwinkle", "warm"] as const;

const hash = (value: string) => [...value].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const BoardThumbnail = ({ id, className }: { id: string; className?: string }) => {
  const variant = VARIANTS[hash(id) % VARIANTS.length];

  return (
    <div
      aria-hidden
      className={cn(
        "relative h-36 overflow-hidden sm:h-40",
        variant === "lavender" && "bg-lavender",
        variant === "periwinkle" && "bg-periwinkle",
        variant === "warm" && "bg-warm",
        className,
      )}
    >
      {variant === "lavender" && (
        <>
          <div className="absolute left-[10%] top-[22%] h-[38%] w-[26%] rounded-xl bg-white shadow-sm">
            <div className="m-3 h-2 w-3/5 rounded-full bg-primary" />
          </div>
          <div className="absolute right-[10%] top-[12%] size-14 rounded-2xl bg-periwinkle" />
          <div className="absolute bottom-[12%] right-[20%] h-12 w-20 rounded-2xl bg-primary/10" />
          <div className="absolute bottom-[24%] left-[24%] h-0.5 w-[24%] rotate-[8deg] rounded-full bg-primary" />
        </>
      )}

      {variant === "periwinkle" && (
        <>
          <div className="absolute left-[8%] top-[18%] h-9 w-[24%] rounded-full border-2 border-primary" />
          <div className="absolute right-[10%] top-[18%] h-9 w-[24%] rounded-full border-2 border-primary" />
          <div className="absolute bottom-[16%] left-[38%] h-9 w-[24%] rounded-full border-2 border-primary" />
          <div className="absolute left-[30%] top-[40%] h-0.5 w-[14%] rotate-[14deg] bg-primary" />
          <div className="absolute right-[28%] top-[40%] h-0.5 w-[14%] -rotate-[14deg] bg-primary" />
        </>
      )}

      {variant === "warm" && (
        <>
          <div className="absolute left-[10%] top-[16%] h-[44%] w-[34%] rounded-xl bg-white shadow-sm">
            <div className="m-3 h-2 w-2/5 rounded-full bg-primary" />
            <div className="mx-3 h-1.5 w-4/5 rounded-full bg-primary/20" />
          </div>
          <div className="absolute right-[12%] top-[20%] size-12 rounded-full bg-periwinkle" />
          <div className="absolute bottom-[14%] right-[16%] h-0.5 w-[16%] -rotate-45 bg-primary" />
        </>
      )}
    </div>
  );
};
