"use client";

import { useId, useState } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Card } from "@/data/types";
import { MERCHANTS, type Merchant } from "@/data/merchants";
import { searchMerchants } from "@/lib/merchants";
import { CATEGORY_LABELS, categoryStyle, type Category } from "@/lib/categories";
import { bestCardFor } from "@/lib/calculators/engine";
import { cn } from "@/lib/cn";

/**
 * "Where are you buying?" under the category buttons. Typing a store finds
 * its usual category from the built-in list (data/merchants.ts); choosing
 * one selects that category, so the wallet answers exactly as if the
 * category had been tapped. Each result already names the best card, so
 * the answer is often readable before anything is chosen.
 */
export function MerchantSearch({
  cards,
  valuations,
  disabled,
  chosen,
  onPick,
}: {
  /** The wallet's cards, or null while it loads. */
  cards: Card[] | null;
  valuations: Record<string, number>;
  disabled?: boolean;
  /** The store picked, owned by the parent so tapping a category clears it. */
  chosen: Merchant | null;
  /** A store picked (its category goes with it), or null when cleared. */
  onPick: (merchant: Merchant | null) => void;
}) {
  const [typed, setTyped] = useState("");
  const query = chosen ? chosen.name : typed;
  const listId = useId();
  const results = chosen ? [] : searchMerchants(MERCHANTS, query);
  const searching = !chosen && query.trim().length >= 2;

  function pick(m: Merchant) {
    setTyped(m.name);
    onPick(m);
  }

  function clear() {
    setTyped("");
    onPick(null);
  }

  return (
    <div className="mt-4">
      <div className="relative max-w-[360px]">
        <MagnifyingGlassIcon
          size={15}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto text-muted"
        />
        <input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            if (chosen) onPick(null);
            setTyped(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              e.preventDefault();
              pick(results[0]);
            }
            if (e.key === "Escape" && query) clear();
          }}
          placeholder="Or search a store, like CVS or Uber Eats"
          aria-label="Search a store or place"
          aria-controls={listId}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-9 w-full rounded-control border border-line bg-bg pr-9 pl-8.5 text-[14px]",
            "placeholder:text-muted transition-[border-color] duration-[var(--cd-dur-hover)] ease-out",
            "hover:border-muted focus-visible:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            "disabled:opacity-40 [&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear the search"
            className="absolute inset-y-0 right-1 my-auto grid size-7 place-items-center rounded-control text-muted transition-[color,transform] duration-[var(--cd-dur-press)] ease-out hover:text-ink active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-focus"
          >
            <XIcon size={13} weight="bold" />
          </button>
        )}
      </div>

      <div id={listId} aria-live="polite">
        {searching && results.length === 0 && (
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            {`"${query.trim()}" is not in the list yet. Pick the closest category above.`}
          </p>
        )}
        {results.length > 0 && (
          <ul className="mt-2 max-w-[520px] divide-y divide-line rounded-inner border border-line bg-bg">
            {results.map((m) => {
              const best = cards?.length ? bestCardFor(cards, m.category, valuations) : null;
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    onClick={() => pick(m)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-[background-color] duration-[var(--cd-dur-hover)] ease-out first:rounded-t-inner last:rounded-b-inner hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{m.name}</span>
                      {best && (
                        <span className="block truncate text-[12px] text-muted">
                          Best: {best.card.name}, {best.rate.multiplier}x
                        </span>
                      )}
                    </span>
                    <CategoryTag category={m.category} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {chosen?.note && (
          <p className="mt-2.5 max-w-[60ch] text-[13px] leading-relaxed text-muted">
            {chosen.note}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryTag({ category }: { category: Category }) {
  return (
    <span
      style={category === "other" ? undefined : categoryStyle(category)}
      className={cn(
        "shrink-0 rounded-control px-2 py-0.5 text-[12px] font-medium",
        category === "other" && "border border-line text-muted",
      )}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
