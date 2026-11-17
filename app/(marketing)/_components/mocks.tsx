import { cn } from "@/lib/utils";

// Small, static drawings of the real product (notes, flow nodes, cursors). Everything here
// is decorative, so it is hidden from assistive tech by the parents (aria-hidden).

export const Cursor = ({
  name,
  className,
  tone = "primary",
}: {
  name: string;
  className?: string;
  tone?: "primary" | "rose";
}) => (
  <div className={cn("absolute flex items-start", className)}>
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={tone === "primary" ? "text-primary" : "text-rose-500"}
    >
      <path
        d="M2 2l12 5-5 1.5L7 14 2 2z"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
    <span
      className={cn(
        "-ml-0.5 mt-3 rounded-md px-2 py-0.5 text-[10px] font-medium text-white",
        tone === "primary" ? "bg-primary" : "bg-rose-600",
      )}
    >
      {name}
    </span>
  </div>
);

export const Note = ({
  title,
  body,
  tone = "lavender",
  rotate = 0,
  className,
}: {
  title?: string;
  body?: string;
  tone?: "lavender" | "periwinkle" | "white";
  rotate?: number;
  className?: string;
}) => (
  <div
    style={{ transform: `rotate(${rotate}deg)` }}
    className={cn(
      "rounded-xl p-3 shadow-sm",
      tone === "lavender" && "bg-lavender",
      tone === "periwinkle" && "bg-periwinkle",
      tone === "white" && "bg-white",
      className,
    )}
  >
    {title && <p className="text-[11px] font-semibold leading-tight">{title}</p>}
    {body && <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{body}</p>}
  </div>
);

export const FlowNode = ({
  label,
  caption,
  className,
}: {
  label: string;
  caption?: string;
  className?: string;
}) => (
  <div className={cn("rounded-lg border-2 border-primary bg-white px-2.5 py-1.5", className)}>
    {caption && <p className="text-[8px] font-semibold text-primary">{caption}</p>}
    <p className="text-[10px] font-semibold leading-tight">{label}</p>
  </div>
);

export const DiamondNode = ({ label, className }: { label: string; className?: string }) => (
  <div className={cn("relative size-14 shrink-0", className)}>
    <div className="absolute inset-2 rotate-45 rounded-md border-2 border-primary bg-white" />
    <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold">
      {label}
    </span>
  </div>
);

export const Avatar = ({ letter, className }: { letter: string; className?: string }) => (
  <span
    className={cn(
      "inline-flex size-6 items-center justify-center rounded-full border-2 border-white bg-lavender text-[10px] font-semibold text-primary",
      className,
    )}
  >
    {letter}
  </span>
);

const WindowChrome = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10">
    <div className="flex items-center gap-x-2 border-b px-4 py-2.5">
      <span className="size-2.5 rounded-full bg-rose-400" />
      <span className="size-2.5 rounded-full bg-amber-300" />
      <span className="size-2.5 rounded-full bg-emerald-400" />
      <span className="mx-auto rounded-md bg-muted px-4 py-0.5 text-[10px] text-muted-foreground">
        {title}
      </span>
      <span className="flex -space-x-1.5">
        <Avatar letter="M" />
        <Avatar letter="D" className="bg-periwinkle" />
      </span>
    </div>
    {children}
  </div>
);

const ToolColumn = () => (
  <div className="absolute left-3 top-4 flex w-7 flex-col items-center gap-y-2.5 rounded-lg border bg-white py-2.5 shadow-sm">
    <span className="size-3.5 rounded-sm bg-primary/80" />
    <span className="size-3.5 rounded-sm border-2 border-slate-400" />
    <span className="size-3.5 rounded-full border-2 border-slate-400" />
    <span className="size-3.5 rotate-45 border-2 border-slate-400" />
  </div>
);

export const HeroBoard = () => (
  <div className="relative" aria-hidden>
    <WindowChrome title="New product ideas">
      <div className="relative h-[300px] bg-canvas sm:h-[340px]">
        <ToolColumn />
        <Note
          title="Improve onboarding"
          body="Make first steps clear."
          rotate={-4}
          className="absolute left-[16%] top-[14%] w-32"
        />
        <Note
          title="User feedback"
          body="Clarify sharing access."
          tone="periwinkle"
          rotate={3}
          className="absolute left-[50%] top-[8%] w-32"
        />
        <Note
          title="Launch strategy"
          rotate={-2}
          className="absolute right-[4%] top-[34%] hidden w-28 sm:block"
        />

        <div className="absolute bottom-[12%] left-[12%] flex items-center gap-x-2 sm:gap-x-3">
          <FlowNode caption="Research" label="Find patterns" />
          <span className="h-0.5 w-4 bg-primary sm:w-6" />
          <DiamondNode label="Decide" />
          <span className="h-0.5 w-4 bg-primary sm:w-6" />
          <FlowNode caption="Next" label="Test together" />
        </div>

        <Cursor name="Maya" className="left-[44%] top-[44%]" />
        <span className="absolute bottom-3 right-3 rounded-lg border bg-white px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
          100%
        </span>
      </div>
    </WindowChrome>

    <div className="absolute -right-2 -top-4 hidden rounded-xl border bg-white px-3.5 py-2.5 shadow-lg sm:block">
      <p className="text-xs font-semibold">Infinite canvas</p>
      <p className="text-[11px] text-muted-foreground">Make room for every idea.</p>
    </div>
    <div className="absolute -bottom-5 left-4 hidden rounded-xl border bg-white px-3.5 py-2.5 shadow-lg sm:block">
      <p className="text-xs font-semibold">Real-time collaboration</p>
      <p className="text-[11px] text-muted-foreground">Everyone sees the same canvas.</p>
    </div>
  </div>
);

export const EditorMock = () => (
  <div
    className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10"
    aria-hidden
  >
    <div className="flex items-center gap-x-2 border-b px-4 py-2.5">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-white">
        S
      </span>
      <span className="text-[11px] font-semibold">Checkout experience</span>
      <span className="text-[10px] text-muted-foreground">Saved</span>
      <span className="ml-auto flex -space-x-1.5">
        <Avatar letter="M" />
        <Avatar letter="D" className="bg-periwinkle" />
      </span>
      <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-white">
        Share
      </span>
    </div>

    <div className="relative h-[300px] bg-canvas">
      <ToolColumn />
      <Note
        title="Where do people hesitate?"
        tone="lavender"
        rotate={-3}
        className="absolute left-[18%] top-[10%] w-36"
      />
      <Note
        title="Clarify fees"
        tone="periwinkle"
        rotate={2}
        className="absolute left-[56%] top-[14%] w-28"
      />

      <div className="absolute left-[44%] top-[40%] flex flex-col items-center rounded-lg border bg-white p-1 shadow-sm">
        <span className="size-3 rounded-sm bg-primary/80" />
      </div>

      <div className="absolute bottom-[10%] left-[14%] flex items-center gap-x-3">
        <FlowNode caption="Start" label="Checkout" />
        <span className="h-0.5 w-5 bg-primary" />
        <DiamondNode label="Ready?" />
        <span className="h-0.5 w-5 bg-primary" />
        <FlowNode caption="Next" label="Payment" />
      </div>
    </div>
  </div>
);

export const CollabMock = () => (
  <div
    className="relative h-[300px] overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10"
    aria-hidden
  >
    <div className="absolute inset-0 bg-canvas" />
    <Note
      title="Research findings"
      body="Keep context visible."
      rotate={-4}
      className="absolute left-[10%] top-[12%] w-32"
    />
    <Note
      title="What to test next"
      tone="periwinkle"
      rotate={2}
      className="absolute right-[8%] top-[8%] w-32"
    />
    <Cursor name="Maya" className="left-[26%] top-[46%]" />
    <Cursor name="Daniel" tone="rose" className="right-[18%] top-[44%]" />
    <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 rounded-lg border bg-white px-3 py-1.5 text-[11px] font-medium shadow-md">
      Share the draft
    </div>
    <div className="absolute bottom-3 left-3 flex items-center gap-x-2 rounded-lg border bg-white px-2.5 py-1.5 shadow-sm">
      <span className="flex -space-x-1.5">
        <Avatar letter="M" />
        <Avatar letter="D" className="bg-periwinkle" />
        <Avatar letter="A" className="bg-warm" />
      </span>
      <span className="text-[10px] text-muted-foreground">3 collaborators</span>
    </div>
  </div>
);

// --- small thumbnails -------------------------------------------------------

export const SpaceThumb = () => (
  <div className="relative h-full w-full" aria-hidden>
    <div className="absolute left-[8%] top-[22%] h-12 w-20 rounded-xl border-2 border-primary bg-white" />
    <div className="absolute right-[10%] top-[12%] h-16 w-24 rounded-2xl bg-lavender shadow-sm" />
    <div className="absolute left-[30%] top-[34%] size-12 rounded-full border-2 border-primary bg-lavender/80" />
    <div className="absolute bottom-[18%] left-[34%] h-0.5 w-24 -rotate-12 bg-primary" />
  </div>
);

export const NotesThumb = () => (
  <div className="relative h-full w-full" aria-hidden>
    <div className="absolute left-[10%] top-[14%] h-16 w-20 -rotate-6 rounded-xl bg-lavender shadow-sm" />
    <div className="absolute left-[34%] top-[28%] h-16 w-20 rotate-3 rounded-xl bg-periwinkle shadow-sm" />
    <div className="absolute right-[10%] top-[20%] h-14 w-16 rounded-xl bg-warm shadow-sm" />
  </div>
);

export const FlowThumb = () => (
  <div className="flex h-full items-center justify-center gap-x-2" aria-hidden>
    <span className="h-9 w-14 rounded-lg border-2 border-primary bg-white" />
    <span className="h-0.5 w-4 bg-primary" />
    <DiamondNode label="?" />
    <span className="h-0.5 w-4 bg-primary" />
    <span className="h-9 w-14 rounded-lg border-2 border-primary bg-white" />
  </div>
);

export const PlanThumb = () => (
  <div className="relative h-full w-full" aria-hidden>
    <div className="absolute left-[10%] top-[18%] h-14 w-28 rounded-xl bg-white p-2.5 shadow-sm">
      <div className="h-1.5 w-1/2 rounded-full bg-primary" />
      <div className="mt-2 h-1 w-4/5 rounded-full bg-primary/20" />
    </div>
    <div className="absolute right-[12%] top-[28%] h-16 w-14 rounded-xl bg-lavender" />
    <div className="absolute bottom-[14%] left-[30%] h-1.5 w-28 rounded-full bg-primary/30" />
  </div>
);

export const DashboardMock = () => (
  <div
    className="flex h-[300px] overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/10"
    aria-hidden
  >
    <div className="hidden w-[22%] shrink-0 space-y-2 border-r bg-sidebar p-3 sm:block">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-white">
        S
      </span>
      <div className="h-6 rounded-md bg-lavender" />
      <div className="h-3 w-4/5 rounded bg-muted" />
      <div className="h-3 w-3/5 rounded bg-muted" />
    </div>

    <div className="flex-1 bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-5 w-14 rounded-md bg-primary" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="h-24 rounded-xl bg-lavender" />
        <div className="h-24 rounded-xl bg-periwinkle" />
        <div className="h-24 rounded-xl bg-warm" />
        <div className="h-24 rounded-xl bg-lavender/70" />
      </div>
    </div>
  </div>
);
