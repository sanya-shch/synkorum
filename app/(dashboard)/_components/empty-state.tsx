import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, children }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
    <span className="flex size-14 items-center justify-center rounded-2xl bg-lavender text-primary">
      <Icon className="size-6" />
    </span>

    <h2 className="mt-6 text-xl font-semibold tracking-tight">{title}</h2>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

    {children && <div className="mt-6">{children}</div>}
  </div>
);
