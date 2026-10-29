"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { Card } from "@/data/types";
import { CARDS } from "@/data/cards.seed";
import type { Category } from "@/lib/categories";
import { rankCards } from "@/lib/calculators/engine";
import { DEFAULT_VALUATION_MAP } from "@/lib/valuations";
import { cn } from "@/lib/cn";
import { CardFace } from "@/components/ui/card-face";
import { Button } from "@/components/ui/button";
import { Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { AnswerLine, CategoryBar } from "@/components/wallet/category-bar";

/**
 * The hero's picker, drawn as an isometric stack of the real cards. Picking
 * a category pulls the winner out of the stack and lays it on top; the rest
 * settle underneath and dim. Same ranking and same control as the Wallet,
 * so what the page demonstrates is what the app does.
 *
 * Until someone touches it, it steps through a few categories by itself,
 * chosen so the default cards each win one. It stops for good on the first
 * interaction, pauses off screen, and never runs under reduced motion.
 *
 * "Change cards" swaps which cards are in the stack, from the catalog, so a
 * visitor can try it on the cards they actually carry.
 *
 * Renders two siblings, the stage and the controls, inside `contents`, so
 * the page's grid places them: the stage beside the headline, the category
 * row across the full width underneath, where all eight fit on one line.
 */

const TOUR: Category[] = ["dining", "flights", "hotels", "gas"];
const TOUR_MS = 2800;

/** Vertical spacing between layers, in the stage's own width units. */
const LAYER = 7;

const MAX_CARDS = 4;
const MIN_CARDS = 2;

export function CardStack({
  cards: initial,
  stageClassName,
  controlsClassName,
}: {
  cards: Card[];
  stageClassName?: string;
  controlsClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [cards, setCards] = useState<Card[]>(initial);
  const [category, setCategory] = useState<Category | null>(TOUR[0]);
  const [touring, setTouring] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  const ranked = category ? rankCards(cards, category, DEFAULT_VALUATION_MAP) : null;
  const winnerId = ranked?.[0]?.card.id ?? null;

  // Order from the floor up. The winner goes on top; everyone else keeps
  // their place, so only one card travels per change.
  const order = cards.map((c) => c.id).filter((id) => id !== winnerId);
  if (winnerId) order.push(winnerId);

  useEffect(() => {
    if (!touring || reduceMotion) return;
    const stage = stageRef.current;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    if (stage) io.observe(stage);
    const id = window.setInterval(() => {
      if (!visible || document.hidden) return;
      setCategory((c) => TOUR[(TOUR.indexOf(c as Category) + 1) % TOUR.length]);
    }, TOUR_MS);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [touring, reduceMotion]);

  const stop = () => setTouring(false);

  function toggleCard(card: Card, on: boolean) {
    stop();
    setCards((cs) =>
      on
        ? cs.length >= MAX_CARDS
          ? cs
          : [...cs, card]
        : cs.length <= MIN_CARDS
          ? cs
          : cs.filter((c) => c.id !== card.id),
    );
  }

  return (
    <div className="contents">
      <div
        ref={stageRef}
        aria-hidden
        className={cn(
          "relative aspect-[10/7] w-full [container-type:inline-size] [perspective:2400px]",
          stageClassName,
        )}
      >
        {/* The plane every layer sits on, tipped into an isometric view. */}
        <div
          className="absolute top-[52%] left-1/2 w-[50%] [transform-style:preserve-3d]"
          style={{ transform: "translate(-50%, -50%) rotateX(58deg) rotateZ(-38deg)" }}
        >
          {/* The floor: a dotted plate with a hairline edge, fading out. */}
          <div
            className="absolute -inset-[22%] rounded-widget border border-line [background-image:radial-gradient(var(--cd-text-muted)_0.8px,transparent_1.2px)] [background-size:4.5cqw_4.5cqw] [mask-image:radial-gradient(closest-side,black_72%,transparent)]"
            style={{ transform: "translateZ(0)" }}
          />
          {/* A soft shadow under the stack, so it sits on the plate. */}
          <div
            className="absolute inset-[4%] rounded-card bg-ink/25 blur-xl dark:bg-black/60"
            style={{ transform: "translateZ(1px)" }}
          />
          <div className="relative aspect-[1.586/1] w-full [transform-style:preserve-3d]">
            {cards.map((card, i) => {
              const level = order.indexOf(card.id);
              const isWinner = card.id === winnerId;
              const z = `${(level + 1) * LAYER}cqw`;
              const lifted = isWinner ? `${(level + 1) * LAYER + 6}cqw` : z;
              return (
                <motion.div
                  key={card.id}
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  // A card swapped in drops onto the stack from just above
                  // it, rather than appearing in place.
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, transform: `translate3d(0%, 0%, ${(level + 3) * LAYER}cqw)` }
                  }
                  animate={{
                    opacity: 1,
                    // The winner slides out of the stack sideways before
                    // rising, rather than passing through the cards above it.
                    transform: isWinner && !reduceMotion
                      ? [
                          null,
                          `translate3d(78%, -6%, ${z})`,
                          `translate3d(78%, -6%, ${lifted})`,
                          `translate3d(0%, 0%, ${lifted})`,
                        ]
                      : `translate3d(0%, 0%, ${lifted})`,
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    transform: reduceMotion
                      ? { duration: 0 }
                      : isWinner
                        ? { duration: 0.9, times: [0, 0.38, 0.62, 1], ease: [0.32, 0.72, 0, 1] }
                        : { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
                  }}
                >
                  <CardFace card={card} priority={i === 0} className="shadow-lifted" />
                  {/* Dimmed with a veil of the page colour rather than
                      opacity, which would let the cards below show through. */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-card bg-bg transition-opacity duration-[var(--cd-dur-panel)] ease-out",
                      winnerId && !isWinner ? "opacity-50" : "opacity-0",
                    )}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div onPointerDown={stop} onKeyDown={stop} className={cn("relative", controlsClassName)}>
        <CategoryBar
          className="md:flex-nowrap"
          value={category}
          onChange={(c) => {
            stop();
            setCategory(c);
          }}
          compact
        />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <AnswerLine
            category={category}
            ranked={ranked}
            empty="Pick what you are buying."
            live={!touring}
            className="min-h-[1.65em] text-sm"
          />
          <CardChooser cards={cards} onToggle={toggleCard} onReset={() => setCards(initial)} />
        </div>
      </div>
    </div>
  );
}

/** Which cards are in the stack: two to four, from the catalog. */
function CardChooser({
  cards,
  onToggle,
  onReset,
}: {
  cards: Card[];
  onToggle: (card: Card, on: boolean) => void;
  onReset: () => void;
}) {
  const chosen = new Set(cards.map((c) => c.id));
  return (
    <Menu
      trigger={
        <Button variant="ghost" size="sm" className="-mr-3.5">
          <SlidersHorizontalIcon size={15} />
          Change cards
        </Button>
      }
    >
      <MenuGroup
        label={
          cards.length >= MAX_CARDS
            ? `${MAX_CARDS} of ${MAX_CARDS} cards. Untick one to swap it.`
            : `Cards in the stack, ${cards.length} of ${MAX_CARDS}`
        }
      >
        {CARDS.map((card) => {
          const on = chosen.has(card.id);
          return (
            <MenuCheckboxItem
              key={card.id}
              checked={on}
              onCheckedChange={(next) => onToggle(card, next)}
              disabled={on ? cards.length <= MIN_CARDS : cards.length >= MAX_CARDS}
            >
              {card.name}
            </MenuCheckboxItem>
          );
        })}
      </MenuGroup>
      <MenuSeparator />
      <MenuItem onClick={onReset}>Back to the sample cards</MenuItem>
    </Menu>
  );
}
