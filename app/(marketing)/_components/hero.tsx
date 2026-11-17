import { Play } from "lucide-react";

import { HeroBoard } from "./mocks";
import { PrimaryCta } from "./cta-link";

export const Hero = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:pb-28 lg:pt-24">
    <div>
      <span className="inline-flex items-center gap-x-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-primary">
        <span className="size-1.5 rounded-full bg-primary" />
        Real-time collaborative whiteboards
      </span>

      <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-[64px]">
        Great ideas don&apos;t happen in isolation.
      </h1>

      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
        Bring your team&apos;s ideas to life on one infinite canvas. Brainstorm, sketch, diagram,
        and collaborate in real time, all in one shared workspace.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <PrimaryCta isLoggedIn={isLoggedIn} />
        <a
          href="#features"
          className="inline-flex h-12 items-center justify-center gap-x-2 rounded-xl border bg-card px-6 text-[15px] font-medium shadow-xs transition hover:bg-muted"
        >
          Explore the workspace
          <Play className="size-3.5" />
        </a>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        No complicated setup. Just open a board and start creating.
      </p>
    </div>

    <HeroBoard />
  </section>
);
