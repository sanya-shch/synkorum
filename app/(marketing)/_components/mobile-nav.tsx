"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MobileNavProps {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
}

export const MobileNav = ({ links, isLoggedIn }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="size-10 cursor-pointer rounded-xl bg-card"
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b bg-background px-4 pb-5 pt-2 shadow-lg">
          <nav className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-3 flex gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border bg-card text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
