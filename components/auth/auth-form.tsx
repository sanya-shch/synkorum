"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  icon: LucideIcon;
  // Validation message; wins over `hint` while present.
  error?: string;
  hint?: string;
  // Rendered on the right of the label row, e.g. "Forgot password?".
  labelAction?: ReactNode;
}

// A labelled input with a leading icon. Password fields get a show/hide toggle. `ref`,
// `name`, `onChange` and `onBlur` pass straight through, so it works with react-hook-form's
// `register(...)` spread.
export function AuthField({
  label,
  icon: Icon,
  error,
  hint,
  labelAction,
  type = "text",
  className,
  ...props
}: AuthFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-x-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <Icon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground"
        />

        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            "h-12 w-full min-w-0 rounded-xl border bg-background pr-4 pl-11 text-[15px] transition outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-400 aria-invalid:ring-3 aria-invalid:ring-red-500/15",
            isPassword && "pr-12",
            className,
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted-foreground transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {revealed ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-2 text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Result of the last submit: an error (red) or a confirmation (green).
export const AuthMessage = ({
  type,
  children,
}: {
  type: "error" | "success";
  children: ReactNode;
}) => (
  <p
    role={type === "error" ? "alert" : "status"}
    className={cn(
      "rounded-xl border px-3.5 py-2.5 text-sm",
      type === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
    )}
  >
    {children}
  </p>
);

export const AuthSubmit = ({ pending, children }: { pending: boolean; children: ReactNode }) => (
  <button
    type="submit"
    disabled={pending}
    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-x-2 rounded-xl bg-black text-[15px] font-semibold text-white shadow-sm transition hover:bg-black/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-white/85"
  >
    {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
    {children}
  </button>
);
