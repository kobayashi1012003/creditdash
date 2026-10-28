"use client";

import { useState } from "react";
import type { Card } from "@/data/types";
import type { Category } from "@/lib/categories";
import { rankCards } from "@/lib/calculators/engine";
import { DEFAULT_VALUATION_MAP } from "@/lib/valuations";
import { cn } from "@/lib/cn";
import { CardFace } from "@/components/ui/card-face";
import { AnswerLine, CategoryBar } from "@/components/wallet/category-bar";

/**
 * The landing-page version of the picker: the real control, the real
 * ranking, a small set of cards. Someone can answer "which card for dinner?"
 * before they have signed up for anything.
 */
export function CardPicker({
  cards,
  className,
}: {
  cards: Card[];
  className?: string;
}) {
  const [category, setCategory] = useState<Category | null>("dining");
  const ranked = category
    ? rankCards(cards, category, DEFAULT_VALUATION_MAP)
    : null;
  const winnerId = ranked?.[0]?.card.id ?? null;

  return (
    <div className={className}>
      <CategoryBar value={category} onChange={setCategory} compact />

      <AnswerLine
        category={category}
        ranked={ranked}
        empty="Pick what you are buying."
        className="mt-4 text-sm"
      />

      <ul className="mt-5 grid grid-cols-3 gap-3">
        {cards.map((card) => {
          const isWinner = card.id === winnerId;
          return (
            <li
              key={card.id}
              className={cn(
                "transition-transform duration-[var(--cd-dur-hover)] ease-out",
                isWinner && "-translate-y-2",
              )}
            >
              <CardFace
                card={card}
                dimmed={winnerId !== null && !isWinner}
                priority
              />
              <p
                className={cn(
                  "mt-2 truncate text-[12px] sm:text-[13px]",
                  isWinner ? "font-medium" : "text-muted",
                )}
              >
                {card.name}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
