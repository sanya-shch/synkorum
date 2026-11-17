import { SectionHeading } from "./section-heading";
import { FlowThumb, NotesThumb, PlanThumb } from "./mocks";

const CASES = [
  {
    title: "Brainstorming",
    text: "Capture ideas, explore possibilities, and turn conversations into something tangible.",
    thumb: <NotesThumb />,
    tint: "bg-warm",
  },
  {
    title: "Flowcharts & diagrams",
    text: "Visualize processes, decisions, and complex ideas.",
    thumb: <FlowThumb />,
    tint: "bg-periwinkle/70",
  },
  {
    title: "Product planning",
    text: "Organize thoughts and create a shared understanding of what comes next.",
    thumb: <PlanThumb />,
    tint: "bg-lavender",
  },
];

export const UseCases = () => (
  <section id="use-cases" className="scroll-mt-20 py-20 sm:py-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeading
          eyebrow="For every kind of thinking"
          title="One canvas. Many ways to think."
        />
        <p className="max-w-sm leading-relaxed text-muted-foreground">
          General-purpose drawing tools make it easy to shape discussions into clear, shared visual
          work.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {CASES.map((item) => (
          <article key={item.title} className="rounded-3xl border bg-card p-4 shadow-xs">
            <div className={`h-44 overflow-hidden rounded-2xl ${item.tint}`}>{item.thumb}</div>
            <h3 className="mt-5 px-2 text-lg font-semibold tracking-tight">{item.title}</h3>
            <p className="mt-1.5 px-2 pb-3 leading-relaxed text-muted-foreground">{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const STEPS = [
  { title: "Create", text: "Start with a blank canvas and bring your first ideas to life." },
  { title: "Collaborate", text: "Invite teammates and work together in real time." },
  {
    title: "Organize",
    text: "Arrange your ideas, align your elements, and turn scattered thoughts into clarity.",
  },
];

export const Steps = () => (
  <section id="how-it-works" className="scroll-mt-20 border-t py-20 sm:py-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <SectionHeading eyebrow="A simple rhythm" title="From a blank canvas to a shared vision." />

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-3xl border bg-card p-7">
            <span className="flex size-9 items-center justify-center rounded-full bg-lavender text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
