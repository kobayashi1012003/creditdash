"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import type { Card, UserCard } from "@/data/types";
import type { Category } from "@/lib/categories";
import { rankCards, rateFor } from "@/lib/best-card";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { canAddCard, FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY, type Plan } from "@/lib/plan";
import { CardFace } from "@/components/ui/card-face";
import { EarnChip } from "@/components/ui/earn-chip";
import { Button } from "@/components/ui/button";
import { AnswerLine, CategoryBar } from "@/components/wallet/category-bar";
import { CardDrawer } from "@/components/wallet/card-drawer";

type Entry = { card: Card; userCard: UserCard };

/**
 * The home screen. The category bar answers the one question the product
 * exists for; the grid below is the wallet itself.
 */
export function WalletView({
  entries,
  plan,
  popular,
}: {
  entries: Entry[];
  plan: Plan;
  /** Three suggestions for someone with an empty wallet. */
  popular: Card[];
}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const cards = entries.map((e) => e.card);
  const ranked = category ? rankCards(cards, category) : null;
  const winnerId = ranked?.[0]?.card.id ?? null;
  const openEntry = entries.find((e) => e.card.id === openCardId) ?? null;

  if (entries.length === 0) {
    return <EmptyWallet popular={popular} />;
  }

  return (
    <>
      <section
        aria-labelledby="picker-heading"
        className="rounded-widget border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="picker-heading" className="mb-4 text-sm font-medium">
          Use which card?
        </h2>
        <CategoryBar value={category} onChange={setCategory} />
        <AnswerLine
          category={category}
          ranked={ranked}
          empty="Pick what you are buying and the best card lifts out of the wallet."
          className="mt-5"
        />
      </section>

      <ul className="mt-6 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ card, userCard }) => {
          const isWinner = card.id === winnerId;
          const dimmed = winnerId !== null && !isWinner;
          const top = topRates(card);

          return (
            <li
              key={card.id}
              className={cn(
                "transition-transform duration-[var(--cd-dur-hover)] ease-out",
                isWinner && "-translate-y-1.5",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenCardId(card.id)}
                className="block w-full rounded-inner text-left transition-transform duration-[var(--cd-dur-press)] ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                aria-label={`Open ${userCard.nickname ?? card.name}`}
              >
                <CardFace card={card} dimmed={dimmed} interactive />
              </button>

              <div className={cn("mt-3", dimmed && "opacity-40")}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-medium">
                    {userCard.nickname ?? card.name}
                  </p>
                  <p className="shrink-0 text-[13px] text-muted">
                    {card.annualFee === 0 ? "No fee" : `${usd(card.annualFee)} a year`}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {top.map((rate) => (
                    <EarnChip
                      key={rate.category}
                      category={rate.category}
                      multiplier={rate.multiplier}
                    />
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        {canAddCard(plan, entries.length) ? (
          <Button variant="outline" size="lg">
            <PlusIcon size={18} />
            Add card
          </Button>
        ) : (
          <UpgradePanel count={entries.length} />
        )}
      </div>

      <CardDrawer
        card={openEntry?.card ?? null}
        userCard={openEntry?.userCard}
        open={openCardId !== null}
        onOpenChange={(next) => !next && setOpenCardId(null)}
      />
    </>
  );
}

/** The two or three rates worth putting on the card face in the grid. */
function topRates(card: Card) {
  return [...card.earnRates]
    .filter((r) => r.category !== "other")
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);
}

/**
 * Shown in place of "Add card" once a free wallet is full. Inline and calm,
 * never a pop-up: the plan is explicit that nothing interrupts.
 */
function UpgradePanel({ count }: { count: number }) {
  return (
    <section className="rounded-widget border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-xl leading-tight">
            That is {count} of {FREE_CARD_LIMIT} cards on the free plan.
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Premium saves as many cards as you own, for $
            {PREMIUM_PRICE_MONTHLY} a month. Your existing cards stay where
            they are either way.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/settings#plan" />}>
          <SparkleIcon size={17} weight="fill" />
          See Premium
        </Button>
      </div>
    </section>
  );
}

/** First run. Three real cards to add beats an illustration and a sentence. */
function EmptyWallet({ popular }: { popular: Card[] }) {
  return (
    <section>
      <div className="max-w-[52ch]">
        <h2 className="font-display text-2xl leading-tight">
          Add the first card you carry.
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          Two cards are enough to start getting an answer. You can add more at
          any time, and nothing is linked to a bank.
        </p>
      </div>

      <ul className="mt-7 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
        {popular.map((card) => (
          <li key={card.id}>
            <CardFace card={card} interactive />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{card.name}</p>
                <p className="text-[13px] text-muted">{card.issuer}</p>
              </div>
              <Button variant="outline" size="sm">
                <PlusIcon size={15} />
                Add
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Button variant="ghost" className="mt-7">
        Search all cards
      </Button>
    </section>
  );
}

export { rateFor };
