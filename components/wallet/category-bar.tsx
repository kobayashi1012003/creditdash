"use client";

import type { Card } from "@/data/types";
import { useRovingFocus } from "@/lib/use-roving-focus";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  categoryStyle,
  type Category,
} from "@/lib/categories";
import type { Ranked } from "@/lib/calculators/engine";
import { rateText } from "@/data/programs";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "@/components/ui/category-icon";

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
  // One tab stop, arrows choosing as they go, which is what makes this fast
  // from a keyboard: Tab in, arrow to "Gas", the answer is already showing.
  const { onKeyDown, itemProps } = useRovingFocus(
    CATEGORIES.length,
    value ? CATEGORIES.indexOf(value) : -1,
    (i) => onChange(CATEGORIES[i]),
  );

  return (
    <div
      role="radiogroup"
      aria-label="Spend category"
      onKeyDown={onKeyDown}
      className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2", className)}
    >
      {CATEGORIES.map((c, i) => {
        const selected = value === c;
        return (
          <button
            key={c}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            // Clicking the chosen category again clears it, so the wallet
            // can go back to showing every card at full strength.
            onClick={() => onChange(selected ? null : c)}
            // "Everything else" owns no pastel (its token is the surface), so
            // selected it takes a grey shade and a darker border instead.
            style={selected && c !== "other" ? categoryStyle(c) : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-control border font-medium",
              compact ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm",
              "transition-[background-color,border-color,color,transform]",
              "duration-[var(--cd-dur-press)] ease-out",
              "active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:pointer-events-none disabled:opacity-40",
              selected
                ? c === "other"
                  ? "border-muted bg-panel text-ink"
                  : "border-transparent"
                : "border-line bg-surface text-muted hover:border-muted hover:text-ink",
            )}
          >
            <CategoryIcon category={c} size={compact ? 14 : 15} className="shrink-0" />
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
  live = true,
  className,
}: {
  category: Category | null;
  ranked: Ranked[] | null;
  /** Shown before a category is picked. */
  empty: string;
  /** Announce changes. Off while something other than the user is driving. */
  live?: boolean;
  className?: string;
}) {
  const top = ranked?.[0];

  return (
    <p
      aria-live={live ? "polite" : "off"}
      className={cn("text-[15px] leading-relaxed", className)}
    >
      {top && category ? (
        <>
          <span className="font-medium">{top.card.name}</span>
          <span className="text-muted">
            {" "}
            {/* Ranked by value, but the line states only the rate: cents
                per dollar is held back for now (owner, 28 October 2026). */}
            {top.boosted && top.rate.boost ? (
              // The boosted rate wins the ranking, so the anywhere rate
              // rides along as a short note rather than a disclaimer.
              <>
                earns {rateText(top.card.program, top.multiplier)} on{" "}
                {CATEGORY_LABELS[category].toLowerCase()} {top.rate.boost.where},{" "}
                {rateText(top.card.program, top.rate.multiplier)} elsewhere.
              </>
            ) : (
              <>
                earns {rateText(top.card.program, top.multiplier)} on{" "}
                {CATEGORY_LABELS[category].toLowerCase()}
                {top.rate.source === "rotating"
                  ? " this quarter, once activated."
                  : top.rate.source === "chosen"
                    ? ", your chosen category."
                    : "."}
              </>
            )}
          </span>
        </>
      ) : (
        <span className="text-muted">{empty}</span>
      )}
    </p>
  );
}

export type { Card };
