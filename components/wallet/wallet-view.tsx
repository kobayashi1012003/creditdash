"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  DotsSixVerticalIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  SortAscendingIcon,
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
import type { Merchant } from "@/data/merchants";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { rankCards } from "@/lib/calculators/engine";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { cardLimit, FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import {
  activeFilterCount,
  matchesFilter,
  NO_FILTER,
  sortCards,
  type WalletFilter,
  type WalletSort,
} from "@/lib/wallet-options";
import {
  addCard,
  addCards,
  removeCards,
  reorderCards,
  useHiddenCardCount,
  useIsLoading,
  useOwnedCardIds,
  usePlan,
  useValuations,
  useWallet,
  type WalletEntry,
} from "@/lib/data";
import { CardFace } from "@/components/ui/card-face";
import { EarnChip } from "@/components/ui/earn-chip";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, ConfirmDialogClose } from "@/components/ui/confirm-dialog";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from "@/components/ui/menu";
import { PageHeader } from "@/components/shell/page-header";
import { AnswerLine, CategoryBar } from "@/components/wallet/category-bar";
import { CardDrawer } from "@/components/wallet/card-drawer";
import { AddCardSheet } from "@/components/wallet/add-card-sheet";
import { ImportOffer } from "@/components/wallet/import-offer";
import { MerchantSearch } from "@/components/wallet/merchant-search";
import { CARD_ART } from "@/data/card-art.generated";
import { firstCardCss } from "@/lib/data/first-card";

export function WalletView() {
  const entries = useWallet();
  const owned = useOwnedCardIds();
  const hidden = useHiddenCardCount();
  const plan = usePlan();
  const valuations = useValuations();
  const isLoading = useIsLoading();

  const [category, setCategory] = useState<Category | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  // Bumped when a category is tapped, which empties the store search.
  const [searchKey, setSearchKey] = useState(0);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [sort, setSort] = useState<WalletSort>({ by: "yours" });
  const [filter, setFilter] = useState<WalletFilter>(NO_FILTER);

  const sensors = useSensors(
    // A small distance threshold keeps a tap on a card from registering as a
    // drag, so opening a card and moving one stay distinct gestures.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const limit = cardLimit(plan);
  const room = Math.max(0, limit - entries.length - hidden);

  function pickCategory(next: Category | null) {
    setCategory(next);
    if (merchant) setMerchant(null);
    setSearchKey((k) => k + 1);
  }
  function pickMerchant(m: Merchant | null) {
    setMerchant(m);
    setCategory(m?.category ?? null);
  }

  // "Add cards" sits in the page header, so it is in reach however long the
  // wallet gets, rather than below the last card.
  const header = (
    <PageHeader
      title="Wallet"
      description="The cards you carry, and which one to reach for."
      action={
        <Button variant="accent" onClick={() => setAdding(true)} disabled={isLoading || editing}>
          <PlusIcon size={16} weight="bold" />
          Add cards
        </Button>
      }
    />
  );
  const sheet = (
    <AddCardSheet
      open={adding}
      onOpenChange={setAdding}
      exclude={owned}
      max={room}
      limitNote={
        room === 0
          ? `The free plan holds ${FREE_CARD_LIMIT} cards and yours is full. Remove one, or move to Premium for as many as you own.`
          : "That is all the free plan has room for. Premium saves as many cards as you own."
      }
      onConfirm={addCards}
    />
  );

  if (isLoading) {
    // The picker needs no stored data, so it renders for real while the
    // wallet loads. It is the largest text on the page, and painting it with
    // the server HTML rather than after hydration is most of the difference
    // in Largest Contentful Paint. A category tapped early is kept.
    return (
      <>
        {header}
        <WalletSkeleton
          picker={
            <Picker
              category={category}
              onChange={pickCategory}
              merchant={merchant}
              onMerchant={pickMerchant}
              cards={null}
              valuations={valuations}
              ranked={null}
              editing={false}
              searchKey={searchKey}
            />
          }
        />
      </>
    );
  }
  if (entries.length === 0) {
    return (
      <>
        {header}
        <ImportOffer />
        <EmptyWallet onAdd={() => setAdding(true)} />
        {sheet}
      </>
    );
  }

  // Editing shows every card in the saved order, since that order is what
  // dragging changes. Otherwise the grid is the sorted, filtered view, and
  // the "which card" answer is chosen from what is on screen.
  const view = editing
    ? entries
    : sortCards(entries.filter((e) => matchesFilter(e.card, filter)), sort, valuations);
  const cards = view.map((e) => e.card);
  const ranked = category && !editing ? rankCards(cards, category, valuations) : null;
  const winnerId = ranked?.[0]?.card.id ?? null;
  const openEntry = entries.find((e) => e.card.id === openCardId) ?? null;
  const filters = activeFilterCount(filter);
  const issuers = [...new Set(entries.map((e) => e.card.issuer))].sort();

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = entries.findIndex((e) => e.card.id === active.id);
    const to = entries.findIndex((e) => e.card.id === over.id);
    await reorderCards(from, to);
  }

  function startEditing() {
    setEditing(true);
    pickCategory(null);
  }
  function finishEditing() {
    if (removing.length > 0) setConfirmRemove(true);
    else setEditing(false);
  }
  function cancelEditing() {
    setRemoving([]);
    setEditing(false);
  }
  async function applyRemovals() {
    await removeCards(removing);
    setRemoving([]);
    setConfirmRemove(false);
    setEditing(false);
  }

  const removingNames = removing
    .map((id) => entries.find((e) => e.card.id === id))
    .filter((e): e is WalletEntry => Boolean(e))
    .map((e) => e.userCard.nickname ?? e.card.name);

  return (
    <>
      {header}
      <Picker
        category={category}
        onChange={pickCategory}
        merchant={merchant}
        onMerchant={pickMerchant}
        cards={cards}
        valuations={valuations}
        ranked={ranked}
        editing={editing}
        searchKey={searchKey}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-[13px] text-muted" aria-live="polite">
          {editing
            ? removing.length > 0
              ? `${removing.length} marked for removal`
              : "Drag to reorder, or mark cards to remove"
            : view.length === entries.length
              ? `${entries.length} ${entries.length === 1 ? "card" : "cards"}${limit !== Infinity ? ` of ${limit}` : ""}`
              : `${view.length} of ${entries.length} cards shown`}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button size="sm" onClick={finishEditing}>
                <CheckIcon size={15} />
                Done
              </Button>
            </>
          ) : (
            <>
              {entries.length > 1 && <SortMenu sort={sort} onChange={setSort} />}
              {entries.length > 1 && (
                <FilterMenu filter={filter} onChange={setFilter} issuers={issuers} count={filters} />
              )}
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <PencilSimpleIcon size={15} />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {view.length === 0 ? (
        <div className="mt-3 rounded-widget border border-dashed border-line px-5 py-8">
          <p className="text-[15px]">No cards match these filters.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setFilter(NO_FILTER)}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={view.map((e) => e.card.id)} strategy={rectSortingStrategy}>
            <ul className="mt-3 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
              {view.map((entry, i) => (
                <WalletCard
                  key={entry.card.id}
                  entry={entry}
                  // The first row is the page's largest paint on every
                  // width; everything below it can wait to be scrolled to.
                  priority={i < 2}
                  editing={editing}
                  marked={removing.includes(entry.card.id)}
                  onToggleRemove={() =>
                    setRemoving((r) =>
                      r.includes(entry.card.id)
                        ? r.filter((x) => x !== entry.card.id)
                        : [...r, entry.card.id],
                    )
                  }
                  isWinner={entry.card.id === winnerId}
                  dimmed={winnerId !== null && entry.card.id !== winnerId}
                  onOpen={() => setOpenCardId(entry.card.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {room === 0 && !editing && (
        <div className="mt-8">
          <UpgradePanel count={entries.length} hidden={hidden} />
        </div>
      )}

      {/* Removing a card deletes its credit history, so a batch of removals
          is confirmed once, naming what goes. */}
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={removing.length === 1 ? `Remove ${removingNames[0]}?` : `Remove ${removing.length} cards?`}
        actions={
          <>
            <ConfirmDialogClose render={<Button variant="ghost" />}>
              {removing.length === 1 ? "Keep it" : "Keep them"}
            </ConfirmDialogClose>
            <Button variant="destructive" onClick={applyRemovals}>
              <TrashIcon size={16} />
              {removing.length === 1 ? "Remove card" : `Remove ${removing.length} cards`}
            </Button>
          </>
        }
      >
        {removing.length > 1 && <p>{removingNames.join(", ")}.</p>}
        <p>
          Credits you have ticked off on {removing.length === 1 ? "this card" : "these cards"} are
          deleted too. Adding a card back later starts its tracker fresh.
        </p>
      </ConfirmDialog>

      <CardDrawer
        card={openEntry?.card ?? null}
        userCard={openEntry?.userCard}
        open={openCardId !== null}
        onOpenChange={(next) => !next && setOpenCardId(null)}
      />
      {sheet}
    </>
  );
}

function sortLabel(s: WalletSort): string {
  if (s.by === "category") return `Best for ${CATEGORY_LABELS[s.category].toLowerCase()}`;
  if (s.by === "fee-low") return "Lowest fee";
  if (s.by === "credits") return "Most credits";
  return "Sort";
}

/**
 * Sorting by a category ranks on value, the same way the answer line
 * does. It changes the view only; the saved order changes in Edit.
 */
function SortMenu({ sort, onChange }: { sort: WalletSort; onChange: (s: WalletSort) => void }) {
  const value = sort.by === "category" ? `category:${sort.category}` : sort.by;
  return (
    <Menu
      trigger={
        <Button variant={sort.by === "yours" ? "ghost" : "outline"} size="sm">
          <SortAscendingIcon size={15} />
          {sortLabel(sort)}
        </Button>
      }
    >
      <MenuRadioGroup
        value={value}
        onValueChange={(v) => {
          if (v.startsWith("category:")) {
            onChange({ by: "category", category: v.slice("category:".length) as Category });
          } else {
            onChange({ by: v as "yours" | "fee-low" | "credits" });
          }
        }}
      >
        <MenuGroup>
          <MenuRadioItem value="yours">Your order</MenuRadioItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Highest earning on">
          {CATEGORIES.map((c) => (
            <MenuRadioItem key={c} value={`category:${c}`}>
              {CATEGORY_LABELS[c]}
            </MenuRadioItem>
          ))}
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Cost">
          <MenuRadioItem value="fee-low">Lowest annual fee</MenuRadioItem>
          <MenuRadioItem value="credits">Most credits a year</MenuRadioItem>
        </MenuGroup>
      </MenuRadioGroup>
    </Menu>
  );
}

function toggled<T>(set: ReadonlySet<T>, item: T, on: boolean): Set<T> {
  const next = new Set(set);
  if (on) next.add(item);
  else next.delete(item);
  return next;
}

/** Choices widen within a group (Amex or Chase) and narrow across groups. */
function FilterMenu({
  filter,
  onChange,
  issuers,
  count,
}: {
  filter: WalletFilter;
  onChange: (f: WalletFilter) => void;
  issuers: string[];
  count: number;
}) {
  return (
    <Menu
      trigger={
        <Button variant={count > 0 ? "outline" : "ghost"} size="sm">
          <FunnelSimpleIcon size={15} />
          {count > 0 ? `Filter (${count})` : "Filter"}
        </Button>
      }
    >
      <MenuGroup label="Issuer">
        {issuers.map((issuer) => (
          <MenuCheckboxItem
            key={issuer}
            checked={filter.issuers.has(issuer)}
            onCheckedChange={(on) =>
              onChange({ ...filter, issuers: toggled(filter.issuers, issuer, on) })
            }
          >
            {issuer}
          </MenuCheckboxItem>
        ))}
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup label="Earns extra on">
        {CATEGORIES.filter((c) => c !== "other").map((c) => (
          <MenuCheckboxItem
            key={c}
            checked={filter.bonus.has(c)}
            onCheckedChange={(on) => onChange({ ...filter, bonus: toggled(filter.bonus, c, on) })}
          >
            {CATEGORY_LABELS[c]}
          </MenuCheckboxItem>
        ))}
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup label="Annual fee">
        <MenuCheckboxItem
          checked={filter.fee === "none"}
          onCheckedChange={(on) => onChange({ ...filter, fee: on ? "none" : "any" })}
        >
          No annual fee
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={filter.fee === "paid"}
          onCheckedChange={(on) => onChange({ ...filter, fee: on ? "paid" : "any" })}
        >
          Has an annual fee
        </MenuCheckboxItem>
      </MenuGroup>
      {count > 0 && (
        <>
          <MenuSeparator />
          <MenuItem onClick={() => onChange(NO_FILTER)}>
            <ArrowCounterClockwiseIcon size={14} />
            Clear filters
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

function WalletCard({
  entry,
  editing,
  marked,
  onToggleRemove,
  isWinner,
  dimmed,
  priority,
  onOpen,
}: {
  entry: WalletEntry;
  editing: boolean;
  marked: boolean;
  onToggleRemove: () => void;
  isWinner: boolean;
  dimmed: boolean;
  priority: boolean;
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
  } = useSortable({ id: card.id, disabled: !editing });

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
        {editing ? (
          // In edit mode the whole card is the drag target, so there is no
          // small handle to aim at on a phone.
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Move ${label}`}
            className="cursor-grab touch-none rounded-card active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <CardFace card={card} priority={priority} dimmed={marked} />
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
            <CardFace card={card} dimmed={dimmed} interactive priority={priority} />
          </button>
        )}
      </div>

      <div className={cn("mt-3", dimmed && "opacity-40")}>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate font-medium", marked && "text-muted line-through")}>{name}</p>
          {editing ? (
            <Button
              variant={marked ? "outline" : "destructive"}
              size="sm"
              onClick={onToggleRemove}
              aria-pressed={marked}
              aria-label={marked ? `Keep ${name}` : `Mark ${name} for removal`}
            >
              {marked ? <ArrowCounterClockwiseIcon size={15} /> : <TrashIcon size={15} />}
              {marked ? "Keep" : "Remove"}
            </Button>
          ) : (
            <p className="shrink-0 text-[13px] text-muted">
              {card.annualFee === 0 ? "No fee" : `${usd(card.annualFee)} a year`}
            </p>
          )}
        </div>
        {!editing && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {top.map((rate) => (
              <EarnChip key={rate.category} category={rate.category} multiplier={rate.multiplier} />
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
 * At the free limit. Inline and calm, never a pop-up. When Premium has
 * ended with more cards saved than Free shows, the extras are hidden, not
 * gone, and this says so: the owner's rule is that nothing is deleted by a
 * plan change.
 */
function UpgradePanel({ count, hidden }: { count: number; hidden: number }) {
  return (
    <section className="rounded-widget border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-xl leading-tight">
            {hidden > 0
              ? `${hidden} more ${hidden === 1 ? "card is" : "cards are"} saved but hidden on Free.`
              : `That is ${count} of ${FREE_CARD_LIMIT} cards on the free plan.`}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {hidden > 0
              ? `Free shows your first ${FREE_CARD_LIMIT}. ${hidden === 1 ? "The other one keeps its credits and history, and comes" : "The others keep their credits and history, and come"} back with Premium, for $${PREMIUM_PRICE_MONTHLY} a month.`
              : `Premium saves as many cards as you own, for $${PREMIUM_PRICE_MONTHLY} a month. Your existing cards stay where they are either way.`}
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
  const popular = POPULAR_CARD_IDS.map(getCard).filter((c): c is Card => Boolean(c));

  return (
    <section aria-labelledby="empty-wallet-heading">
      <div className="max-w-[52ch]">
        <h2 id="empty-wallet-heading" className="font-display text-2xl leading-tight">
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
  merchant,
  onMerchant,
  cards,
  valuations,
  ranked,
  editing,
  searchKey,
}: {
  category: Category | null;
  onChange: (next: Category | null) => void;
  merchant: Merchant | null;
  onMerchant: (m: Merchant | null) => void;
  cards: Card[] | null;
  valuations: Record<string, number>;
  ranked: ReturnType<typeof rankCards> | null;
  editing: boolean;
  searchKey: number;
}) {
  return (
    <section
      aria-labelledby="picker-heading"
      className="rounded-widget border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="picker-heading" className="mb-4 text-sm font-medium">
        Use which card?
      </h2>
      <CategoryBar value={category} onChange={onChange} disabled={editing} />
      <MerchantSearch
        // A new key empties the box when a category is tapped instead.
        key={searchKey}
        cards={cards}
        valuations={valuations}
        disabled={editing}
        chosen={merchant}
        onPick={onMerchant}
      />
      <AnswerLine
        category={editing ? null : category}
        ranked={editing ? null : ranked}
        empty={
          editing
            ? "Drag a card to move it, or tab to one and press space."
            : "Pick what you are buying, or search a store, and the best card lifts out of the wallet."
        }
        className="mt-5"
      />
    </section>
  );
}

/**
 * One rule per card with art, keyed off the attribute the pre-start script
 * sets on <html>. Built once, at module load, from the build-time manifest.
 */
const FIRST_CARD_CSS = firstCardCss(CARD_ART);

/**
 * Shown while browser storage is read. The picker above it is real; the
 * cards are shaped like the grid so the page does not jump when they arrive.
 */
function WalletSkeleton({ picker }: { picker: ReactNode }) {
  return (
    <>
      {picker}
      {/* Paints the wallet's real first card into the first slot before the
          app has started; see lib/data/first-card.ts. A card without art,
          or an empty wallet, leaves a plain skeleton. */}
      <style dangerouslySetInnerHTML={{ __html: FIRST_CARD_CSS }} />
      <div aria-busy aria-live="polite">
        <span className="sr-only">Loading your wallet</span>
        <div className="mt-6 h-8 w-16 rounded-pill bg-surface" />
        <ul className="mt-3 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div
                className={cn(
                  "aspect-[1.586/1] w-full rounded-card bg-surface bg-cover bg-center",
                  i === 0 && "first-card-art",
                )}
              />
              <div className="mt-3 h-4 w-2/3 rounded-pill bg-surface" />
              <div className="mt-2.5 h-6 w-full rounded-pill bg-surface" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
