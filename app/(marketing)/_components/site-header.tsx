import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LogoMark } from "@/components/logo";

import { HeaderShell } from "./header-shell";
import { MobileNav } from "./mobile-nav";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#collaboration", label: "Collaboration" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#how-it-works", label: "How it works" },
];

export const SiteHeader = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <HeaderShell>
    <div className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-x-2.5">
        <LogoMark />
        <span className="text-lg font-semibold tracking-tight">Synkorum</span>
      </Link>

      <nav aria-label="Sections" className="hidden items-center gap-x-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-x-3">
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="hidden h-10 items-center gap-x-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 md:inline-flex"
          >
            Open dashboard
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <>
            <Link href="/login" className="hidden px-2 text-sm font-medium md:inline">
              Log in
            </Link>
            <Link
              href="/register"
              className="hidden h-10 items-center gap-x-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 md:inline-flex"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </>
        )}

        <MobileNav links={NAV_LINKS} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  </HeaderShell>
);
