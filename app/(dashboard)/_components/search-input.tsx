"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 400;

// The input is deliberately uncontrolled: the URL (?search=) is the source of truth, we
// only write to it after the user stops typing, and we only overwrite the field from
// the URL when it is not being edited (e.g. a sidebar link cleared the search).
export const SearchInput = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement !== el) el.value = urlSearch;
  }, [urlSearch]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, DEBOUNCE_MS);
  };

  return (
    <label className="relative block w-full">
      <span className="sr-only">Search boards</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        defaultValue={urlSearch}
        onChange={onChange}
        placeholder="Search boards"
        className="h-11 w-full rounded-xl border bg-card pl-10 pr-14 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:block">
        ⌘K
      </kbd>
    </label>
  );
};
