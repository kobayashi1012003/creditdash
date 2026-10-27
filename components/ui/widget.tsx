import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type WidgetProps = ComponentProps<"section"> & {
  title?: string;
  /** Sits opposite the title: a filter, a count, a link. */
  action?: ReactNode;
};

/**
 * The base surface every dashboard panel sits on. Grouping comes from the
 * border and the spacing; the shadow is one soft layer and does no work on
 * its own.
 */
export function Widget({
  title,
  action,
  className,
  children,
  ...props
}: WidgetProps) {
  return (
    <section
      className={cn(
        "rounded-widget border border-line bg-surface p-6 shadow-soft",
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title && (
            <h2 className="font-display text-xl leading-tight">{title}</h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
