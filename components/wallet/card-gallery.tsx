"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { ALL_CARDS } from "@/data/cards.seed";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { matchesFilter } from "@/lib/wallet-options";
import { searchCatalog } from "@/lib/data";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CardFace } from "@/components/ui/card-face";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL, banksOf, shortBank, Tick } from "@/components/wallet/add-card-sheet";

/**
 * The empty Wallet: the whole catalog as a gallery of real card faces, with
 * the bank tabs, a search, and fee and earning filters, to tick every card
 * someone carries and add them in one press (owner, 16 November 2026). It
 * replaces the three "popular" cards and the search button; the same
 * catalog opens as a sheet from "Add cards" once the wallet has cards.
 *
 * Laid out like the card details window, a large panel with its own
 * header, but in the page rather than over it.
 */
export function CardGallery({
  max,
  limitNote,
  onConfirm,
}: {
  /** How many may be picked: the plan's room. */
  max: number;
  /** Shown once `max` is reached. */
  limitNote: string;
  onConfirm: (cardIds: string[]) => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [bank, setBank] = useState<string>(ALL);
  const [noFee, setNoFee] = useState(false);
  const [bonus, setBonus] = useState<ReadonlySet<Category>>(new Set());
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const banks = banksOf(ALL_CARDS);
  const tabs = [ALL, ...banks];
  const { onKeyDown, itemProps } = useRovingFocus(tabs.length, tabs.indexOf(bank), (i) => setBank(tabs[i]));

  const filter = { issuers: new Set<string>(), bonus, fee: noFee ? ("none" as const) : ("any" as const) };
  const matches = searchCatalog(query, new Set(), ALL_CARDS).filter((c) => matchesFilter(c, filter));
  const results = bank === ALL ? matches : matches.filter((c) => c.issuer === bank);
  const elsewhere = bank !== ALL && results.length === 0 ? matches.length : 0;
  const filtered = noFee || bonus.size > 0 || query.trim() !== "";
  const full = picked.length >= max;
  const n = picked.length;

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= max ? p : [...p, id]));
  }
  function toggleBonus(c: Category) {
    setBonus((b) => {
      const next = new Set(b);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }
  function clearFilters() {
    setQuery("");
    setNoFee(false);
    setBonus(new Set());
  }
  async function confirm() {
    setBusy(true);
    await onConfirm(picked);
    setBusy(false);
  }

  return (
    <section
      aria-labelledby="gallery-heading"
      className="rounded-widget border border-line bg-surface shadow-soft"
    >
      <div className="border-b border-line px-5 pt-6 pb-5 sm:px-7">
        <h2 id="gallery-heading" className="font-display text-[26px] leading-[1.1] tracking-[-0.03em] sm:text-[30px]">
          Pick the cards you carry.
        </h2>
        {/* Banks as an even grid of same-size tabs. A red badge counts the
            cards picked at each bank, so picks made under another tab stay
            visible after moving on. */}
        <div
          role="tablist"
          aria-label="Banks"
          onKeyDown={onKeyDown}
          // One row of equal tabs that scrolls sideways on a phone; from sm
          // an even grid, two rows of five. relative: see the quality floor.
          className="relative -mx-5 mt-5 flex gap-1.5 overflow-x-auto px-5 pt-2 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0"
        >
          {tabs.map((b, i) => {
            const on = b === bank;
            const count = (b === ALL ? matches : matches.filter((c) => c.issuer === b)).length;
            const pickedHere =
              b === ALL ? 0 : picked.filter((id) => ALL_CARDS.find((c) => c.id === id)?.issuer === b).length;
            return (
              <button
                key={b}
                {...itemProps(i)}
                type="button"
                role="tab"
                id={`gallery-tab-${i}`}
                aria-selected={on}
                aria-controls="gallery-panel"
                aria-label={`${b === ALL ? "All banks" : b}, ${count} cards${pickedHere ? `, ${pickedHere} picked` : ""}`}
                onClick={() => setBank(b)}
                className={cn(
                  "relative flex h-10 w-[96px] shrink-0 items-center justify-center rounded-control border px-2 text-[13px] font-medium sm:w-auto sm:min-w-0",
                  "transition-[background-color,border-color,color,transform] duration-[var(--cd-dur-press)] ease-out",
                  "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  on ? "border-ink bg-ink text-surface" : "border-line text-muted hover:border-muted hover:text-ink",
                )}
              >
                <span className="truncate">{b === ALL ? "All" : shortBank(b)}</span>
                {pickedHere > 0 && (
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-destructive px-1 text-[11px] leading-none font-semibold text-surface tabular-nums ring-2 ring-surface"
                  >
                    {pickedHere}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon
              size={15}
              className="pointer-events-none absolute inset-y-0 left-2.5 my-auto text-muted"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={bank === ALL ? "Search cards" : `Search ${shortBank(bank)} cards`}
              aria-label="Search cards"
              className="h-9 rounded-inner pl-8 text-[16px] md:text-[13px]"
            />
          </div>
          {/* One row that scrolls sideways on a phone, so the cards start
              on the first screen; wrapping from sm. */}
          <div className="relative -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:contents">
          <FilterChip on={noFee} onClick={() => setNoFee((v) => !v)}>
            No annual fee
          </FilterChip>
          <span className="sr-only" id="earns-label">
            Earns extra on
          </span>
          {CATEGORIES.filter((c) => c !== "other").map((c) => (
            <FilterChip key={c} on={bonus.has(c)} onClick={() => toggleBonus(c)} describedBy="earns-label">
              <CategoryIcon category={c} size={14} />
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
          {filtered && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-control px-1 text-[13px] text-muted underline underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Clear
            </button>
          )}
          </div>
        </div>
      </div>

      <div
        id="gallery-panel"
        role="tabpanel"
        aria-labelledby={`gallery-tab-${tabs.indexOf(bank)}`}
        className="px-5 py-6 sm:px-7"
      >
        {full && max > 0 && (
          <p className="mb-5 rounded-inner bg-panel px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
            {limitNote}
          </p>
        )}
        {results.length === 0 ? (
          <div className="py-6 text-sm leading-relaxed text-muted">
            <p>No card matches these filters.</p>
            <div className="mt-2 flex flex-wrap gap-x-4">
              {elsewhere > 0 && (
                <button
                  type="button"
                  onClick={() => setBank(ALL)}
                  className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {elsewhere === 1 ? "1 match" : `${elsewhere} matches`} at other banks
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
            {results.map((card, i) => {
              const on = picked.includes(card.id);
              const blocked = !on && full;
              return (
                <li key={card.id} className="min-w-0">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={blocked}
                    onClick={() => toggle(card.id)}
                    className={cn(
                      "group block w-full rounded-inner text-left",
                      "transition-[transform,opacity] duration-[var(--cd-dur-press)] ease-out active:scale-[0.98]",
                      "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
                      "disabled:opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "relative block rounded-card",
                        "outline-2 outline-offset-3 transition-[outline-color] duration-[var(--cd-dur-hover)] ease-out",
                        on ? "outline-[var(--cd-mint-ink)]" : "outline-transparent",
                      )}
                    >
                      <CardFace
                        card={card}
                        interactive={!blocked}
                        priority={i < 4}
                        sizes="(max-width: 768px) 45vw, (max-width: 1280px) 30vw, 240px"
                      />
                      {on && (
                        <span className="absolute top-2 right-2">
                          <Tick on />
                        </span>
                      )}
                    </span>
                    <span className="mt-2.5 block text-[14px] leading-snug font-medium sm:text-[15px]">
                      {card.name}
                    </span>
                    <span className="block text-[13px] text-muted">
                      {shortBank(card.issuer)},{" "}
                      {card.pending ? "details soon" : card.annualFee === 0 ? "no fee" : `${usd(card.annualFee)} a year`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Once something is picked: stays in reach at the foot of the screen
          while the gallery scrolls, above the phone's tab bar. */}
      {n > 0 && (
      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-widget border-t border-line bg-surface/95 px-5 py-4 backdrop-blur-sm sm:px-7 lg:bottom-0">
        <p className="text-[13px] text-muted" aria-live="polite">
          {n} {n === 1 ? "card" : "cards"} picked
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setPicked([])} disabled={busy}>
            Clear picks
          </Button>
          <Button onClick={confirm} disabled={busy}>
            <PlusIcon size={16} weight="bold" />
            {`Add ${n} ${n === 1 ? "card" : "cards"}`}
          </Button>
        </div>
      </div>
      )}
    </section>
  );
}

function FilterChip({
  on,
  onClick,
  describedBy,
  children,
}: {
  on: boolean;
  onClick: () => void;
  describedBy?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-describedby={describedBy}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control border px-3 text-[13px]",
        "transition-[background-color,border-color,color,transform] duration-[var(--cd-dur-press)] ease-out",
        "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        on ? "border-ink bg-panel text-ink" : "border-line text-muted hover:border-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
