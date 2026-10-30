"use client";

import { useState } from "react";
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
 * The card catalog, searchable, with several cards picked at once and
 * added in one press. Opens as a right panel on desktop and a bottom sheet
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
}) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const results = searchCatalog(query, exclude);
  const full = picked.length >= max;

  function close() {
    setQuery("");
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
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto text-muted"
            />
            <Input
              autoFocus={isDesktop}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card or issuer"
              aria-label="Search cards"
              className="h-10 rounded-inner pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {full && limitNote && (
            <p className="mb-3 rounded-inner bg-panel px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
              {limitNote}
            </p>
          )}
          {results.length === 0 ? (
            <p className="py-6 text-sm leading-relaxed text-muted">
              {query.trim()
                ? `Nothing matches "${query.trim()}". The catalog covers a small set of cards for now.`
                : "Every card in the catalog is already here."}
            </p>
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
                        <CardFace card={card} />
                      </span>
                      {/* Name and issuer wrap rather than truncate: a card the
                          reader cannot fully see is a card they cannot choose. */}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-snug">{card.name}</span>
                        <span className="block text-[13px] text-muted">
                          {card.issuer},{" "}
                          {card.annualFee === 0 ? "no fee" : `${usd(card.annualFee)} a year`}
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
