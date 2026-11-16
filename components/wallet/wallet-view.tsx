"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  FunnelSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  SortAscendingIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Card } from "@/data/types";
import type { Merchant } from "@/data/merchants";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { effectiveEarnRates, rankCards, rateFor } from "@/lib/calculators/engine";
import { isCashBack } from "@/data/programs";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { cardCount, cardLimit, FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from "@/lib/plan";
import {
  activeFilterCount,
  matchesFilter,
  NO_FILTER,
  sortCards,
  type WalletFilter,
  type WalletSort,
} from "@/lib/wallet-options";
import {
  addCards,
  removeCards,
  setCardOrder,
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
import { EditWalletDialog, type WalletEdit } from "@/components/wallet/edit-wallet-dialog";
import { CardGallery } from "@/components/wallet/card-gallery";
import { ImportOffer } from "@/components/wallet/import-offer";
import { MerchantSearch } from "@/components/wallet/merchant-search";
import { CARD_ART } from "@/data/card-art.generated";
import { firstCardCss } from "@/lib/data/first-card";
import { useStoredFlag } from "@/lib/use-stored-flag";

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
  // An edit with removals in it, waiting on the confirm below.
  const [pending, setPending] = useState<WalletEdit | null>(null);
  const [sort, setSort] = useState<WalletSort>({ by: "yours" });
  const [filter, setFilter] = useState<WalletFilter>(NO_FILTER);

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
        // An empty wallet shows the whole catalog below instead.
        !isLoading && entries.length === 0 ? undefined : (
        <Button variant="accent" onClick={() => setAdding(true)} disabled={isLoading}>
          <PlusIcon size={16} weight="bold" />
          Add cards
        </Button>
        )
      }
    />
  );
  const sheet = (
    <AddCardSheet
      includePending
      open={adding}
      onOpenChange={setAdding}
      exclude={owned}
      max={room}
      limitNote={
        room === 0
          ? `The free plan holds ${cardCount(FREE_CARD_LIMIT)} and yours is full. Remove it, or move to Premium for as many as you own.`
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
        <CardGallery
          max={room}
          limitNote={`The free plan holds ${cardCount(FREE_CARD_LIMIT)}. Premium saves as many cards as you own.`}
          onConfirm={addCards}
        />
        {sheet}
      </>
    );
  }

  // The grid is the sorted, filtered view, and the "which card" answer is
  // chosen from what is on screen. The saved order is changed in Edit.
  const view = sortCards(entries.filter((e) => matchesFilter(e.card, filter)), sort, valuations);
  const cards = view.map((e) => e.card);
  const ranked = category ? rankCards(cards, category, valuations, merchant?.brand) : null;
  const winnerId = ranked?.[0]?.card.id ?? null;
  const openEntry = entries.find((e) => e.card.id === openCardId) ?? null;
  const filters = activeFilterCount(filter);
  const issuers = [...new Set(entries.map((e) => e.card.issuer))].sort();

  // Removing deletes credit history, so an edit with removals is confirmed
  // first; a new order alone saves at once.
  async function saveEdit(edit: WalletEdit) {
    if (edit.removing.length > 0) {
      setPending(edit);
      return;
    }
    setEditing(false);
    await setCardOrder(edit.order);
  }
  async function applyEdit() {
    if (!pending) return;
    const { order, removing } = pending;
    setPending(null);
    setEditing(false);
    await setCardOrder(order.filter((id) => !removing.includes(id)));
    await removeCards(removing);
  }

  const removing = pending?.removing ?? [];
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
        searchKey={searchKey}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-[13px] text-muted" aria-live="polite">
          {view.length === entries.length
            ? `${entries.length} ${entries.length === 1 ? "card" : "cards"}${limit !== Infinity ? ` of ${limit}` : ""}`
            : `${view.length} of ${entries.length} cards shown`}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {entries.length > 1 && <SortMenu sort={sort} onChange={setSort} />}
          {entries.length > 1 && (
            <FilterMenu filter={filter} onChange={setFilter} issuers={issuers} count={filters} />
          )}
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <PencilSimpleIcon size={15} />
            Edit
          </Button>
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
        <ul className="mt-3 grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
          {view.map((entry, i) => (
            <WalletCard
              key={entry.card.id}
              entry={entry}
              // The first row is the page's largest paint on every width;
              // everything below it can wait to be scrolled to.
              priority={i < 2}
              isWinner={entry.card.id === winnerId}
              dimmed={winnerId !== null && entry.card.id !== winnerId}
              onOpen={() => setOpenCardId(entry.card.id)}
            />
          ))}
        </ul>
      )}

      {room === 0 && (
        <div className="mt-8">
          <UpgradePanel count={entries.length} hidden={hidden} />
        </div>
      )}

      {/* Removing a card deletes its credit history, so a batch of removals
          is confirmed once, naming what goes. */}
      <EditWalletDialog open={editing} onOpenChange={setEditing} entries={entries} onSave={saveEdit} />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={removing.length === 1 ? `Remove ${removingNames[0]}?` : `Remove ${removing.length} cards?`}
        actions={
          <>
            <ConfirmDialogClose render={<Button variant="ghost" />}>
              {removing.length === 1 ? "Keep it" : "Keep them"}
            </ConfirmDialogClose>
            <Button variant="destructive" onClick={applyEdit}>
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

/** The wallet grid: one column on a phone, two from sm, three from xl. */
const WALLET_CARD_SIZES = "(max-width: 640px) 92vw, (max-width: 1280px) 45vw, 320px";

function WalletCard({
  entry,
  isWinner,
  dimmed,
  priority,
  onOpen,
}: {
  entry: WalletEntry;
  isWinner: boolean;
  dimmed: boolean;
  priority: boolean;
  onOpen: () => void;
}) {
  const { card, userCard } = entry;
  const name = userCard.nickname ?? card.name;
  // A nickname replaces the name under the card, but the face still prints
  // the real one. Both go in the label, so "Open Venture X" works for
  // someone using voice control who reads it off the card.
  const label = userCard.nickname ? `${userCard.nickname}, ${card.name}` : card.name;
  const top = topRates(card);

  return (
    <li
      className={cn(
        "transition-transform duration-[var(--cd-dur-hover)] ease-out",
        isWinner && "-translate-y-1.5",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-inner text-left transition-transform duration-[var(--cd-dur-press)] ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        aria-label={`Open ${label}`}
      >
        <CardFace card={card} dimmed={dimmed} interactive priority={priority} sizes={WALLET_CARD_SIZES} />
      </button>

      <div className={cn("mt-3", dimmed && "opacity-40")}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{name}</p>
          <p className="shrink-0 text-[13px] text-muted">
            {card.pending
              ? null
              : card.annualFee === 0
                ? "No fee"
                : `${usd(card.annualFee)} a year`}
          </p>
        </div>
        {card.pending && <p className="mt-2 text-[13px] text-muted">Details coming soon</p>}
        {!card.pending && (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {top.rates.map((rate) => (
                <EarnChip
                  key={rate.category}
                  category={rate.category}
                  multiplier={rate.multiplier}
                  percent={isCashBack(card.program)}
                  where={rate.where}
                />
              ))}
            </div>
            {top.wheres.length > 0 && (
              <p aria-hidden className="mt-1.5 text-[12px] leading-snug text-muted">
                * {top.wheres.join("; ")}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/**
 * The two or three rates worth showing under a card in the grid: the
 * highest it earns in each category, above its everything-else rate. A
 * rate that only applies through the issuer's travel site or at one brand
 * is shown at that rate with an asterisk, and the footnote says where
 * (owner's choice, 2 November 2026). Ranking uses the same best rate.
 * With no bonus at all, the base rate shows on its own.
 */
function topRates(card: Card) {
  const base = rateFor(card, "other");
  const rates = effectiveEarnRates(card)
    .filter((r) => r.category !== "other")
    .map((r) =>
      r.boost
        ? { category: r.category, multiplier: r.boost.multiplier, where: r.boost.where }
        : r.source === "rotating"
          ? { category: r.category, multiplier: r.multiplier, where: "this quarter only, activate first" }
          : { category: r.category, multiplier: r.multiplier, where: undefined },
    )
    .filter((r) => r.multiplier > base.multiplier)
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);
  if (rates.length === 0) {
    return { rates: [{ category: base.category, multiplier: base.multiplier, where: undefined }], wheres: [] };
  }
  const wheres = [...new Set(rates.flatMap((r) => (r.where ? [r.where] : [])))];
  return { rates, wheres };
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
              : `That is ${count} of ${cardCount(FREE_CARD_LIMIT)} on the free plan.`}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {hidden > 0
              ? `Free shows your first card. ${hidden === 1 ? "The other one keeps its credits and history, and comes" : "The others keep their credits and history, and come"} back with Premium, from $${PREMIUM_PRICE_MONTHLY} a month or $${PREMIUM_PRICE_YEARLY} a year.`
              : `Premium saves as many cards as you own, for $${PREMIUM_PRICE_MONTHLY} a month or $${PREMIUM_PRICE_YEARLY} a year. Your card stays where it is either way.`}
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
  searchKey,
}: {
  category: Category | null;
  onChange: (next: Category | null) => void;
  merchant: Merchant | null;
  onMerchant: (m: Merchant | null) => void;
  cards: Card[] | null;
  valuations: Record<string, number>;
  ranked: ReturnType<typeof rankCards> | null;
  searchKey: number;
}) {
  // Hideable, and remembered in this browser, for someone who only uses the
  // Wallet to look at their cards (owner, 16 November 2026).
  const [hidden, setHidden] = useStoredFlag(PICKER_HIDDEN_KEY, false);
  return (
    <section
      aria-labelledby="picker-heading"
      className={cn("rounded-widget border border-line bg-surface", hidden ? "px-5 py-3 sm:px-6" : "p-5 sm:p-6")}
    >
      <div className={cn("flex items-center justify-between gap-3", !hidden && "mb-4")}>
        <h2 id="picker-heading" className="text-sm font-medium">
          Use which card?
        </h2>
        <button
          type="button"
          aria-expanded={!hidden}
          aria-controls="picker-body"
          onClick={() => {
            // A category left picked would keep dimming cards with nothing
            // on screen to say why.
            if (!hidden) onChange(null);
            setHidden(!hidden);
          }}
          className="-mr-1.5 inline-flex h-8 items-center gap-1 rounded-control px-1.5 text-[13px] text-muted transition-[color,transform] duration-[var(--cd-dur-press)] ease-out hover:text-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {hidden ? "Show" : "Hide"}
          <CaretDownIcon
            size={13}
            aria-hidden
            className={cn("transition-transform duration-[var(--cd-dur-hover)] ease-out", !hidden && "rotate-180")}
          />
        </button>
      </div>
      <div id="picker-body" hidden={hidden}>
        <CategoryBar value={category} onChange={onChange} />
        <MerchantSearch
          // A new key empties the box when a category is tapped instead.
          key={searchKey}
          cards={cards}
          valuations={valuations}
          chosen={merchant}
          onPick={onMerchant}
        />
        {/* No prompt before a pick (owner, 16 November 2026): the
            buttons and the search say what to do. The line stays mounted,
            empty and without margin, so the answer is still announced. */}
        <AnswerLine category={category} ranked={ranked} className={category && ranked?.length ? "mt-5" : undefined} />
      </div>
    </section>
  );
}

/** Whether "Use which card?" is folded away, in this browser. */
const PICKER_HIDDEN_KEY = "creditdash:picker-hidden";

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
