import { CircleCheck } from "lucide-react";

import { DashboardMock } from "./mocks";
import { SectionHeading } from "./section-heading";

export const Workspace = () => (
  <section className="pb-20 sm:pb-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="grid items-center gap-10 rounded-[32px] bg-warm/70 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
        <div>
          <SectionHeading eyebrow="A home for your work" title="Everything your team needs, in one place.">
            <p>
              Keep your boards organized and your team connected with dedicated workspaces.
            </p>
          </SectionHeading>

          <ul className="mt-7 space-y-3">
            {[
              "Multiple organizations and member roles",
              "Board management, favorites, and search",
              "Invite teammates to your workspace",
            ].map((item) => (
              <li key={item} className="flex items-center gap-x-3 text-[15px]">
                <CircleCheck className="size-5 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <DashboardMock />
      </div>
    </div>
  </section>
);
