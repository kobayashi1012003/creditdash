"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowsOutCardinalIcon,
  CheckIcon,
  DotsSixVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/data/types";
import { getCard } from "@/data/cards.seed";
import type { Category } from "@/lib/categories";
import { rankCards } from "@/lib/calculators/engine";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import {
  canAddCard,
  cardLimit,
  FREE_CARD_LIMIT,
  PREMIUM_PRICE_MONTHLY,
} from "@/lib/plan";
import {
  addCard,
  removeCard,
  reorderCards,
  useIsLoading,
  usePlan,
  useValuations,
  useWallet,
  type WalletEntry,
} from "@/lib/data";
import { CardFace } from "@/components/ui/card-face";
import { EarnChip } from "@/components/ui/earn-chip";
import { Button } from "@/components/ui/button";
import { AnswerLine, CategoryBar } from "@/components/wallet/category-bar";
import { CardDrawer } from "@/components/wallet/card-drawer";
import { AddCardSheet } from "@/components/wallet/add-card-sheet";
import { ImportOffer } from "@/components/wallet/import-offer";

export function WalletView() {
  const entries = useWallet();
  const plan = usePlan();
  const valuations = useValuations();
  const isLoading = useIsLoading();

  const [category, setCategory] = useState<Category | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [arranging, setArranging] = useState(false);

  const sensors = useSensors(
    // A small distance threshold keeps a tap on a card from registering as a
    // drag, so opening a card and moving one stay distinct gestures.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (isLoading) {
    // The picker needs no stored data, so it renders for real while the
    // wallet loads. It is the largest text on the page, and painting it with
    // the server HTML rather than after hydration is most of the difference
    // in Largest Contentful Paint. A category tapped early is kept.
    return (
      <WalletSkeleton
        picker={
          <Picker
            category={category}
            onChange={setCategory}
            ranked={null}
            arranging={false}
          />
        }
      />
    );
  }
  if (entries.length === 0) {
    return (
      <>
        <ImportOffer />
        <EmptyWallet onAdd={() => setAdding(true)} />
        <AddCardSheet open={adding} onOpenChange={setAdding} />
      </>
    );
  }

  const cards = entries.map((e) => e.card);
  const ranked = category ? rankCards(cards, category, valuations) : null;
  // Arranging and highlighting are different questions; do not do both.
  const winnerId = arranging ? null : (ranked?.[0]?.card.id ?? null);
  const openEntry = entries.find((e) => e.card.id === openCardId) ?? null;
  const limit = cardLimit(plan);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = entries.findIndex((e) => e.card.id === active.id);
    const to = entries.findIndex((e) => e.card.id === over.id);
    await reorderCards(from, to);
  }

  return (
    <>
      <Picker
        category={category}
        onChange={setCategory}
        ranked={ranked}
        arranging={arranging}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {entries.length} {entries.length === 1 ? "card" : "cards"}
          {limit !== Infinity && ` of ${limit}`}
        </p>
        {entries.length > 1 && (
          <Button
            variant={arranging ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setArranging((a) => !a);
              setCategory(null);
            }}
            aria-pressed={arranging}
          >
            {arranging ? <CheckIcon size={15} /> : <ArrowsOutCardinalIcon size={15} />}
            {arranging ? "Done" : "Rearrange"}
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={entries.map((e) => e.card.id)}
          strategy={rectSortingStrategy}
        >
          <ul className="mt-3 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <WalletCard
                key={entry.card.id}
                entry={entry}
                arranging={arranging}
                isWinner={entry.card.id === winnerId}
                dimmed={winnerId !== null && entry.card.id !== winnerId}
                onOpen={() => setOpenCardId(entry.card.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="mt-8">
        {canAddCard(plan, entries.length) ? (
          <Button variant="outline" size="lg" onClick={() => setAdding(true)}>
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
      <AddCardSheet open={adding} onOpenChange={setAdding} />
    </>
  );
}

function WalletCard({
  entry,
  arranging,
  isWinner,
  dimmed,
  onOpen,
}: {
  entry: WalletEntry;
  arranging: boolean;
  isWinner: boolean;
  dimmed: boolean;
  onOpen: () => void;
}) {
  const { card, userCard } = entry;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !arranging });

  const name = userCard.nickname ?? card.name;
  // A nickname replaces the name under the card, but the face still prints
  // the real one. Both go in the label, so "Open Venture X" works for
  // someone using voice control who reads it off the card.
  const label = userCard.nickname ? `${userCard.nickname}, ${card.name}` : card.name;
  const top = topRates(card);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "transition-[transform,opacity] duration-[var(--cd-dur-hover)] ease-out",
        isWinner && "-translate-y-1.5",
        isDragging && "z-10 opacity-80",
      )}
    >
      <div className="relative">
        {arranging ? (
          // In rearrange mode the whole card is the drag target, so there is
          // no small handle to aim at on a phone.
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Move ${label}`}
            className="cursor-grab touch-none rounded-inner active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <CardFace card={card} />
            <span className="pointer-events-none absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-pill bg-bg/85 text-ink backdrop-blur-sm">
              <DotsSixVerticalIcon size={16} weight="bold" />
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="block w-full rounded-inner text-left transition-transform duration-[var(--cd-dur-press)] ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            aria-label={`Open ${label}`}
          >
            <CardFace card={card} dimmed={dimmed} interactive />
          </button>
        )}
      </div>

      <div className={cn("mt-3", dimmed && "opacity-40")}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium">{name}</p>
          {arranging ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCard(card.id)}
              aria-label={`Remove ${name} from your wallet`}
            >
              <TrashIcon size={15} />
              Remove
            </Button>
          ) : (
            <p className="shrink-0 text-[13px] text-muted">
              {card.annualFee === 0 ? "No fee" : `${usd(card.annualFee)} a year`}
            </p>
          )}
        </div>
        {!arranging && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {top.map((rate) => (
              <EarnChip
                key={rate.category}
                category={rate.category}
                multiplier={rate.multiplier}
              />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** The two or three rates worth showing under a card in the grid. */
function topRates(card: Card) {
  return [...card.earnRates]
    .filter((r) => r.category !== "other")
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);
}

/**
 * Replaces "Add card" once a free wallet is full. Inline and calm, never a
 * pop-up: the plan is explicit that nothing interrupts.
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

/**
 * Three widely held cards, one tap each, so a new wallet can be useful
 * before anyone has opened the catalog. A no-fee card is in the set on
 * purpose: not everyone starting out pays an annual fee.
 */
const POPULAR_CARD_IDS = ["csp", "amex-gold", "bilt"];

/** First run, or after deleting everything. */
function EmptyWallet({ onAdd }: { onAdd: () => void }) {
  const popular = POPULAR_CARD_IDS.map(getCard).filter(
    (c): c is Card => Boolean(c),
  );

  return (
    <section aria-labelledby="empty-wallet-heading">
      <div className="max-w-[52ch]">
        <h2
          id="empty-wallet-heading"
          className="font-display text-2xl leading-tight"
        >
          Add the first card you carry.
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          Two cards are enough to start getting an answer. Nothing is linked to
          a bank, and you can change your mind at any time.
        </p>
      </div>

      <h3 className="mt-8 text-sm font-medium">Popular to start with</h3>
      {/* Three across at every width. Full-width faces on a phone would push
          the search two screens down; CardFace scales by container query,
          so a small face still reads as the card. */}
      <ul className="mt-3 grid max-w-[900px] grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-5">
        {popular.map((card) => (
          <li key={card.id} className="min-w-0">
            <button
              type="button"
              onClick={() => addCard(card.id)}
              className="group block w-full rounded-inner text-left transition-transform duration-[var(--cd-dur-press)] ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            >
              <CardFace card={card} interactive />
              <span className="mt-2.5 line-clamp-2 text-[13px] leading-snug font-medium sm:text-[15px]">
                {card.name}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-muted transition-colors duration-[var(--cd-dur-hover)] ease-out group-hover:text-ink">
                <PlusIcon size={13} weight="bold" />
                Add
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Button variant="outline" size="lg" className="mt-8" onClick={onAdd}>
        <MagnifyingGlassIcon size={18} />
        Search all cards
      </Button>
    </section>
  );
}

/**
 * The "Use which card?" panel. Its own component because it renders in two
 * states: live over the wallet, and for real above the loading skeleton.
 */
function Picker({
  category,
  onChange,
  ranked,
  arranging,
}: {
  category: Category | null;
  onChange: (next: Category | null) => void;
  ranked: ReturnType<typeof rankCards> | null;
  arranging: boolean;
}) {
  return (
    <section
      aria-labelledby="picker-heading"
      className="rounded-widget border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="picker-heading" className="mb-4 text-sm font-medium">
        Use which card?
      </h2>
      <CategoryBar value={category} onChange={onChange} disabled={arranging} />
      <AnswerLine
        category={arranging ? null : category}
        ranked={arranging ? null : ranked}
        empty={
          arranging
            ? "Drag a card to move it, or tab to one and press space."
            : "Pick what you are buying and the best card lifts out of the wallet."
        }
        className="mt-5"
      />
    </section>
  );
}

/**
 * Shown while browser storage is read. The picker above it is real; the
 * cards are shaped like the grid so the page does not jump when they arrive.
 */
function WalletSkeleton({ picker }: { picker: ReactNode }) {
  return (
    <>
      {picker}
      <div aria-busy aria-live="polite">
        <span className="sr-only">Loading your wallet</span>
        <div className="mt-6 h-8 w-16 rounded-pill bg-surface" />
        <ul className="mt-3 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div className="aspect-[1.586/1] w-full rounded-inner bg-surface" />
              <div className="mt-3 h-4 w-2/3 rounded-pill bg-surface" />
              <div className="mt-2.5 h-6 w-full rounded-pill bg-surface" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
