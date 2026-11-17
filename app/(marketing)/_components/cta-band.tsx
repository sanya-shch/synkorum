import Link from "next/link";

import { PrimaryCta } from "./cta-link";

export const CtaBand = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="bg-primary py-20 text-primary-foreground sm:py-24">
    <div className="mx-auto flex max-w-[720px] flex-col items-center px-4 text-center sm:px-6">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-primary">
        S
      </span>

      <h2 className="mt-7 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Your next great idea starts here.
      </h2>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-white/90">
        Create a shared space for your ideas. Bring your team together and start building something
        meaningful.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <PrimaryCta isLoggedIn={isLoggedIn} inverted />
        {!isLoggedIn && (
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/40 px-6 text-[15px] font-medium transition hover:bg-white/10"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  </section>
);
