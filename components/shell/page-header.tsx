import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  /** One line. If it needs two, the page is doing too much. */
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Every app page opens the same way: title, one line of context, and at most
 * one action. No eyebrow label above the title; the heading carries itself.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-7 flex flex-wrap items-start justify-between gap-x-6 gap-y-4",
        className,
      )}
    >
      <div>
        <h1 className="font-display text-[32px] leading-none sm:text-[40px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-[56ch] text-[15px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
