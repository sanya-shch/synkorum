import Link from "next/link";
import { Layers, type LucideIcon } from "lucide-react";

interface AuthShellProps {
  // Short line on the right of the header; hidden on very narrow screens.
  tagline: string;
  footer: string;
  children: React.ReactNode;
}

// Full-page frame shared by the sign-in and registration screens: brand on the left, a
// tagline on the right, the card centered, a quiet line at the bottom.
export const AuthShell = ({ tagline, footer, children }: AuthShellProps) => (
  <div className="flex min-h-dvh flex-col bg-background">
    <header className="flex items-center justify-between gap-x-6 px-6 py-5 sm:px-10">
      <Link href="/" className="flex items-center gap-x-3">
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-black text-white dark:bg-white dark:text-black"
        >
          <Layers className="size-5" />
        </span>
        <span className="text-xl font-bold tracking-tight">Synkorum</span>
      </Link>

      <p className="hidden text-sm text-muted-foreground sm:block">{tagline}</p>
    </header>

    <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>

    <footer className="px-6 pb-8 text-center text-sm text-muted-foreground">{footer}</footer>
  </div>
);

interface AuthCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthCard = ({ icon: Icon, eyebrow, title, description, children }: AuthCardProps) => (
  <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm sm:p-9">
    <span
      aria-hidden
      className="inline-flex size-11 items-center justify-center rounded-xl bg-lavender"
    >
      <Icon className="size-5" />
    </span>

    <p className="mt-6 text-sm font-medium">{eyebrow}</p>
    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[26px]">{title}</h1>
    <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{description}</p>

    <div className="mt-8">{children}</div>
  </section>
);

// "──── New to Synkorum? ────"
export const AuthDivider = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 flex items-center gap-x-4 text-[13px] text-muted-foreground">
    <span aria-hidden className="h-px flex-1 bg-border" />
    {children}
    <span aria-hidden className="h-px flex-1 bg-border" />
  </div>
);

// Full-width outlined link, the quieter sibling of the black submit button.
export const authSecondaryLinkClass =
  "flex h-12 w-full items-center justify-center rounded-xl border bg-card text-[15px] font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
