import { cn } from "@/lib/utils";

export const SectionHeading = ({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-sm font-medium text-primary">{eyebrow}</p>
    <h2 className={cn("mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl")}>
      {title}
    </h2>
    {children && <div className="mt-4 text-lg leading-relaxed text-muted-foreground">{children}</div>}
  </div>
);
