"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardFace } from "@/components/ui/card-face";
import { addCard, useAddableCards } from "@/lib/data";
import { usd } from "@/lib/format";
import { useIsDesktop } from "@/lib/use-media-query";

/**
 * The card catalog, searchable. Opens as a right panel on desktop and a
 * bottom sheet on a phone, matching the card detail drawer so the two feel
 * like the same surface.
 */
export function AddCardSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const results = useAddableCards(query);

  async function pick(cardId: string) {
    await addCard(cardId);
    setQuery("");
    onOpenChange(false);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="data-[swipe-direction=right]:sm:[--drawer-content-width:28rem]">
        <div className="border-b border-line px-5 pt-4 pb-4">
          <DrawerTitle className="mb-3 font-display text-xl leading-none">
            Add a card
          </DrawerTitle>
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto text-muted"
            />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by card or issuer"
              aria-label="Search cards"
              className="h-10 rounded-inner pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {results.length === 0 ? (
            <p className="py-6 text-sm leading-relaxed text-muted">
              {query.trim()
                ? `Nothing matches "${query.trim()}". The catalog covers a small set of cards for now.`
                : "Every card in the catalog is already in your wallet."}
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => pick(card.id)}
                    className="flex w-full items-center gap-3.5 rounded-inner border border-line p-3 text-left transition-[border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="w-16 shrink-0">
                      <CardFace card={card} />
                    </span>
                    {/* Name and issuer wrap rather than truncate: a card the
                        reader cannot fully see is a card they cannot choose. */}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-snug">
                        {card.name}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {card.issuer}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[13px] text-muted">
                      {card.annualFee === 0 ? "No fee" : usd(card.annualFee)}
                    </span>
                    <PlusIcon size={17} className="shrink-0 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
