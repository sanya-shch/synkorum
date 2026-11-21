import { formatDistanceToNowStrict } from "date-fns";

import { demoExpiresAt, DEMO_LIMITS } from "@/lib/demo-config";
import { MAX_LAYERS } from "@/lib/constants";

import { DemoSignUpButton } from "./demo-sign-up-button";

// Shown only inside a demo session: what the visitor is in, what it is limited to, and
// when it ends.
export const DemoBanner = ({ createdAt }: { createdAt: Date }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b bg-lavender/70 px-4 py-2 text-center text-sm">
    <span>
      <strong className="font-semibold">Demo session</strong> - up to {DEMO_LIMITS.boards} boards,{" "}
      {MAX_LAYERS} shapes each. Ends in {formatDistanceToNowStrict(demoExpiresAt(createdAt))}.
    </span>
    <DemoSignUpButton />
  </div>
);
