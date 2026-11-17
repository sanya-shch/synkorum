import type { LucideIcon } from "lucide-react";
import { GitBranch, Move, StickyNote, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";
import { FlowThumb, NotesThumb, SpaceThumb, Cursor, Avatar } from "./mocks";

const FeatureCard = ({
  icon: Icon,
  title,
  text,
  tone,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: "warm" | "lavender" | "primary";
  className?: string;
  children: React.ReactNode;
}) => {
  const onPrimary = tone === "primary";

  return (
    <article
      className={cn(
        "flex flex-col rounded-3xl border p-7 sm:p-8",
        tone === "warm" && "bg-warm/70",
        tone === "lavender" && "bg-lavender",
        onPrimary && "border-primary bg-primary text-primary-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          onPrimary ? "bg-white/15" : "bg-card text-primary shadow-xs",
        )}
      >
        <Icon className="size-5" />
      </span>

      <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
      <p
        className={cn(
          "mt-2 max-w-md leading-relaxed",
          onPrimary ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {text}
      </p>

      <div
        className={cn(
          "mt-7 h-40 flex-1 overflow-hidden rounded-2xl",
          onPrimary ? "bg-white" : "bg-card",
        )}
      >
        {children}
      </div>
    </article>
  );
};

export const Features = () => (
  <section id="features" className="scroll-mt-20 border-t py-20 sm:py-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <SectionHeading
        eyebrow="Built for visual thinking"
        title="Everything you need to turn ideas into action."
      >
        <p className="max-w-xl">
          From the first rough sketch to a structured plan, Synkorum gives your team the tools to
          think visually.
        </p>
      </SectionHeading>

      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        <FeatureCard
          icon={Move}
          tone="warm"
          title="Your ideas deserve more space."
          text="Explore ideas freely on a flexible canvas. Move, arrange, resize, and organize objects as your thinking evolves."
          className="lg:col-span-7"
        >
          <SpaceThumb />
        </FeatureCard>

        <FeatureCard
          icon={StickyNote}
          tone="lavender"
          title="Capture every thought."
          text="Collect ideas, write notes, and organize thoughts visually using colorful sticky notes and text."
          className="lg:col-span-5"
        >
          <NotesThumb />
        </FeatureCard>

        <FeatureCard
          icon={GitBranch}
          tone="warm"
          title="Make complex ideas clear."
          text="Use shapes, arrows, and visual structures to map out processes, explain concepts, and communicate ideas."
          className="lg:col-span-5"
        >
          <FlowThumb />
        </FeatureCard>

        <FeatureCard
          icon={Users}
          tone="primary"
          title="Work together, in real time."
          text="See collaborators’ cursors, selections, and changes as they happen. Everyone works on the same shared canvas."
          className="lg:col-span-7"
        >
          <div className="relative h-full bg-canvas">
            <div className="absolute left-[10%] top-[18%] h-12 w-24 rounded-xl bg-lavender shadow-sm" />
            <div className="absolute right-[14%] top-[30%] h-12 w-20 rounded-xl bg-periwinkle shadow-sm" />
            <Cursor name="Daniel" className="left-[42%] top-[34%]" />
            <span className="absolute bottom-3 right-3 flex -space-x-1.5">
              <Avatar letter="M" />
              <Avatar letter="D" className="bg-periwinkle" />
            </span>
          </div>
        </FeatureCard>
      </div>
    </div>
  </section>
);
