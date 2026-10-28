"use client";

import type { Card } from "@/data/types";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  categoryStyle,
  type Category,
} from "@/lib/categories";
import type { Ranked } from "@/lib/best-card";
import { cn } from "@/lib/cn";

/**
 * The category buttons. Shared by the landing hero and the Wallet, so the
 * thing the landing page demonstrates is literally the thing the app ships.
 */
export function CategoryBar({
  value,
  onChange,
  compact = false,
  disabled = false,
  className,
}: {
  value: Category | null;
  onChange: (next: Category | null) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Spend category"
      className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2", className)}
    >
      {CATEGORIES.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(selected ? null : c)}
            style={selected ? categoryStyle(c) : undefined}
            className={cn(
              "rounded-pill border font-medium",
              compact ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm",
              "transition-[background-color,border-color,color,transform]",
              "duration-[var(--cd-dur-press)] ease-out",
              "active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:pointer-events-none disabled:opacity-40",
              selected
                ? "border-transparent"
                : "border-line bg-surface text-muted hover:border-muted hover:text-ink",
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The answer in words. A highlighted card on its own leaves the user to work
 * out why it won; this says it.
 */
export function AnswerLine({
  category,
  ranked,
  empty,
  className,
}: {
  category: Category | null;
  ranked: Ranked[] | null;
  /** Shown before a category is picked. */
  empty: string;
  className?: string;
}) {
  const top = ranked?.[0];

  return (
    <p
      aria-live="polite"
      className={cn("text-[15px] leading-relaxed", className)}
    >
      {top && category ? (
        <>
          <span className="font-medium">{top.card.name}</span>
          <span className="text-muted">
            {" "}
            earns {top.rate.multiplier}x on{" "}
            {CATEGORY_LABELS[category].toLowerCase()}, worth{" "}
            {top.centsPerDollar.toFixed(1)} cents per dollar.
          </span>
        </>
      ) : (
        <span className="text-muted">{empty}</span>
      )}
    </p>
  );
}

export type { Card };
