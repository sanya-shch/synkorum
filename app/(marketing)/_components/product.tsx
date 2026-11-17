import { Maximize, ScanEye, Eye, RefreshCw, Share2 } from "lucide-react";

import { SectionHeading } from "./section-heading";
import { CollabMock, EditorMock } from "./mocks";

const Point = ({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) => (
  <li className="flex gap-x-4">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-primary">
      <Icon className="size-5" />
    </span>
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 leading-relaxed text-muted-foreground">{text}</p>
    </div>
  </li>
);

export const Product = () => (
  <section id="product" className="scroll-mt-20 border-t py-20 sm:py-24">
    <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
      <EditorMock />

      <div>
        <SectionHeading
          eyebrow="The product, up close"
          title="A workspace that moves at the speed of thought."
        >
          <p>
            Create, select, align, and arrange your visual thinking in one shared editor that keeps
            the focus on your canvas.
          </p>
        </SectionHeading>

        <ul className="mt-8 space-y-6">
          <Point
            icon={Maximize}
            title="Precise organization"
            text="Select multiple objects, align elements, and distribute space with focused controls."
          />
          <Point
            icon={ScanEye}
            title="Explore every scale"
            text="Pan across the canvas and zoom from the details to the bigger picture."
          />
        </ul>
      </div>
    </div>
  </section>
);

export const Collaboration = () => (
  <section id="collaboration" className="scroll-mt-20 bg-lavender py-20 sm:py-24">
    <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
      <div>
        <SectionHeading eyebrow="Made for momentum" title="Better ideas happen together.">
          <p>Bring your team into the same creative space, wherever everyone is working from.</p>
        </SectionHeading>

        <ul className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "See everyone’s work",
              text: "Follow collaborators’ cursors and selections on the shared canvas.",
            },
            {
              icon: RefreshCw,
              title: "Stay in sync",
              text: "Changes appear instantly as everyone works in real time.",
            },
            {
              icon: Share2,
              title: "Share with anyone",
              text: "Invite teammates or share a board with edit or view-only access.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <CollabMock />
    </div>
  </section>
);
