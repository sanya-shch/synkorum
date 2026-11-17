import Link from "next/link";

import { LogoMark } from "@/components/logo";

export const SiteFooter = () => (
  <footer className="border-t">
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <Link href="/" className="inline-flex items-center gap-x-2.5">
          <LogoMark className="size-8 text-sm" />
          <span className="font-semibold tracking-tight">Synkorum</span>
        </Link>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          A real-time collaborative visual workspace for thinking together, making sense of ideas,
          and building what&apos;s next.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Product</h3>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          <li>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
          </li>
          <li>
            <a href="#use-cases" className="hover:text-foreground">
              Use cases
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Get started</h3>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          <li>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </li>
          <li>
            <Link href="/register" className="hover:text-foreground">
              Create a workspace
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t">
      <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Synkorum</p>
        <p>Built for shared thinking.</p>
      </div>
    </div>
  </footer>
);
