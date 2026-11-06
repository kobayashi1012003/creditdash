"use client";

import { useState } from "react";
import { ALL_CARDS, CARDS } from "@/data/cards.seed";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardFace } from "@/components/ui/card-face";
import { searchCatalog } from "@/lib/data";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { useIsDesktop } from "@/lib/use-media-query";

/**
 * The card catalog, in tabs by bank with a search inside the chosen tab,
 * with several cards picked at once and added in one press. Opens as a right panel on desktop and a bottom sheet
 * on a phone, matching the card detail drawer so the two feel like the
 * same surface. The Wallet and Compare both use it; they differ only in
 * what is left out, how many may be picked and what confirming does.
 */
export function AddCardSheet({
  open,
  onOpenChange,
  exclude,
  max = Infinity,
  limitNote,
  title = "Add cards",
  verb = "Add",
  onConfirm,
  includePending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cards that cannot be picked: already in the wallet, already compared. */
  exclude: ReadonlySet<string>;
  /** How many may be picked this time. */
  max?: number;
  /** Shown once `max` is reached, saying why nothing more can be picked. */
  limitNote?: string;
  title?: string;
  /** The confirm button's verb: "Add 2 cards", "Compare 2 cards". */
  verb?: string;
  onConfirm: (cardIds: string[]) => Promise<void> | void;
  /** Offer cards added before their data. The Wallet does; Compare cannot. */
  includePending?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [bank, setBank] = useState<string>(ALL);
  const source = includePending ? ALL_CARDS : CARDS;
  const banks = banksOf(source);
  const matches = searchCatalog(query, exclude, source);
  const results = bank === ALL ? matches : matches.filter((c) => c.issuer === bank);
  // A search that finds nothing in this bank but something elsewhere says so.
  const elsewhere = bank !== ALL && results.length === 0 ? matches.length : 0;
  const full = picked.length >= max;
  const tabs = [ALL, ...banks];
  const { onKeyDown, itemProps } = useRovingFocus(tabs.length, tabs.indexOf(bank), (i) =>
    setBank(tabs[i]),
  );

  function close() {
    setQuery("");
    setBank(ALL);
    setPicked([]);
    onOpenChange(false);
  }

  function toggle(id: string) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= max ? p : [...p, id],
    );
  }

  async function confirm() {
    setBusy(true);
    await onConfirm(picked);
    setBusy(false);
    close();
  }

  const n = picked.length;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="data-[swipe-direction=right]:sm:[--drawer-content-width:28rem]">
        <div className="border-b border-line px-5 pt-4 pb-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <DrawerTitle className="font-display text-xl leading-none">{title}</DrawerTitle>
            {n > 0 && (
              <span className="text-[13px] tabular-nums text-muted" aria-live="polite">
                {n} selected
              </span>
            )}
          </div>
          {/* Banks as tabs. A row that scrolls sideways on a phone; relative
              so anything sr-only inside stays inside it. */}
          <div
            role="tablist"
            aria-label="Banks"
            onKeyDown={onKeyDown}
            className="relative -mx-5 flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
          >
            {tabs.map((b, i) => {
              const on = b === bank;
              const count = (b === ALL ? source : source.filter((c) => c.issuer === b)).filter(
                (c) => !exclude.has(c.id),
              ).length;
              return (
                <button
                  key={b}
                  {...itemProps(i)}
                  type="button"
                  role="tab"
                  id={`bank-tab-${i}`}
                  aria-selected={on}
                  aria-controls="bank-panel"
                  onClick={() => setBank(b)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-control border px-3 py-1.5 text-[13px] font-medium",
                    "transition-[background-color,border-color,color,transform] duration-[var(--cd-dur-press)] ease-out",
                    "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    on ? "border-ink bg-ink text-surface" : "border-line text-muted hover:border-muted hover:text-ink",
                  )}
                >
                  {b === ALL ? "All" : shortBank(b)}
                  <span className={cn("tabular-nums", on ? "text-surface/70" : "text-muted/80")}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative mt-3">
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
        </div>

        <div
          id="bank-panel"
          role="tabpanel"
          aria-labelledby={`bank-tab-${tabs.indexOf(bank)}`}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
        >
          {full && limitNote && (
            <p className="mb-3 rounded-inner bg-panel px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
              {limitNote}
            </p>
          )}
          {results.length === 0 ? (
            <div className="py-6 text-sm leading-relaxed text-muted">
              <p>
                {query.trim()
                  ? `No ${bank === ALL ? "" : `${shortBank(bank)} `}card matches "${query.trim()}".`
                  : bank === ALL
                    ? "Every card in the catalog is already here."
                    : `Every ${shortBank(bank)} card in the catalog is already here.`}
              </p>
              {elsewhere > 0 && (
                <button
                  type="button"
                  onClick={() => setBank(ALL)}
                  className="mt-2 rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {elsewhere === 1 ? "1 match" : `${elsewhere} matches`} at other banks
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {results.map((card) => {
                const on = picked.includes(card.id);
                const blocked = !on && full;
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={blocked}
                      onClick={() => toggle(card.id)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-inner border p-3 text-left",
                        "transition-[border-color,background-color,transform,opacity] duration-[var(--cd-dur-press)] ease-out",
                        "active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                        "disabled:pointer-events-none disabled:opacity-40",
                        on ? "border-[var(--cd-mint-ink)] bg-mint/40" : "border-line hover:border-muted",
                      )}
                    >
                      <span className="w-16 shrink-0">
                        <CardFace card={card} sizes="64px" />
                      </span>
                      {/* Name and issuer wrap rather than truncate: a card the
                          reader cannot fully see is a card they cannot choose. */}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-snug">{card.name}</span>
                        <span className="block text-[13px] text-muted">
                          {card.issuer},{" "}
                          {card.pending
                            ? "details coming soon"
                            : card.annualFee === 0
                              ? "no fee"
                              : `${usd(card.annualFee)} a year`}
                        </span>
                      </span>
                      <Tick on={on} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={confirm} disabled={n === 0 || busy}>
            {n > 0 ? `${verb} ${n} ${n === 1 ? "card" : "cards"}` : max === 0 ? "No room for more cards" : "Pick cards to add"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** The selection mark: an empty ring, or a green circle with a check. */
export function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-pill border",
        "transition-[background-color,border-color,transform] duration-[var(--cd-dur-press)] ease-out",
        on
          ? "scale-100 border-transparent bg-[var(--cd-mint-ink)] text-surface"
          : "border-line bg-surface",
      )}
    >
      <CheckIcon
        size={13}
        weight="bold"
        className={cn(
          "transition-[opacity,transform] duration-[var(--cd-dur-press)] ease-out",
          on ? "scale-100 opacity-100" : "scale-[0.95] opacity-0",
        )}
      />
    </span>
  );
}

const ALL = "all";

/** Banks in the list, most cards first, so the big issuers lead the row. */
function banksOf(cards: readonly { issuer: string }[]): string[] {
  const counts = new Map<string, number>();
  for (const c of cards) counts.set(c.issuer, (counts.get(c.issuer) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([b]) => b);
}

/** Tab labels people actually say. */
function shortBank(issuer: string): string {
  return issuer === "American Express" ? "Amex" : issuer;
}
