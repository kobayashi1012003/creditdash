"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PlusIcon, SlidersHorizontalIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { Card, UserCard } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { cardAnnualCreditValue, creditState, liveCredits } from "@/lib/credits";
import { daysUntilReset } from "@/lib/credits/reset";
import { longDate, money, monthName, pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  setAnniversary,
  useCreditUsage,
  useIsLoading,
  usePointBalances,
  useValuations,
  useWallet,
  type WalletEntry,
} from "@/lib/data";
import type { CreditUsage } from "@/lib/data/schema";
import { TRACKER_CARD_KEY, useStoredValue } from "@/lib/use-stored-value";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { Widget } from "@/components/ui/widget";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CardFace } from "@/components/ui/card-face";
import { CreditRow } from "@/components/tracker/credit-row";
import { CustomizeDrawer } from "@/components/tracker/customize-drawer";
import { arrangeCredits, creditTint } from "@/lib/tracker-prefs";
import { localDate } from "@/lib/credits/autofill";
import { Button } from "@/components/ui/button";

/** Which card the Tracker last showed, in this browser. */

/** The app's ease-out curve (--cd-ease-out), for Motion, which takes numbers. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function TrackerView() {
  const entries = useWallet();
  const usage = useCreditUsage();
  const balances = usePointBalances();
  const valuations = useValuations();
  const isLoading = useIsLoading();
  const [storedId, setStoredId] = useStoredValue(TRACKER_CARD_KEY);
  const reduceMotion = useReducedMotion();

  if (isLoading) return <TrackerSkeleton />;

  if (entries.length === 0) {
    return (
      <Widget title="Nothing to track yet">
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Add a card in the Wallet and any credits it offers show up here.
        </p>
        <Button className="mt-5" nativeButton={false} render={<Link href="/wallet" />}>
          <PlusIcon size={17} />
          Add a card
        </Button>
      </Widget>
    );
  }

  // The last card shown, if it is still in the wallet. With one card there
  // is nothing to choose between, so it opens straight on it.
  const selected =
    entries.find((e) => e.card.id === storedId) ?? (entries.length === 1 ? entries[0] : null);

  if (!selected) {
    return <ChooseCard entries={entries} usage={usage} onChoose={setStoredId} />;
  }

  const { card, userCard } = selected;
  // Hidden credits leave the totals as well as the list: hiding one says
  // it is not worth tracking.
  const { shown } = arrangeCredits(liveCredits(card.credits), userCard.prefs);
  const states = shown.map((credit) => ({
    credit,
    state: creditState(credit, userCard, usage),
  }));
  const available = states.reduce((s, x) => s + x.state.available, 0);
  const used = states.reduce((s, x) => s + x.state.usedTotal, 0);

  // Not just "ends this month": an anniversary credit can be days from
  // resetting in May. What matters is the window closing, whenever that is.
  //
  // The test is on the closing window, not the year. A credit whose October
  // is spent but whose year is not would otherwise show here with nothing
  // left to claim, which is the opposite of a useful reminder.
  const expiring = states
    .filter(
      ({ credit, state }) =>
        state.expiringSoon &&
        state.currentIndex !== -1 &&
        credit.amount - (state.used[state.currentIndex] ?? 0) > 0,
    )
    .map((x) => ({
      ...x,
      days: daysUntilReset({
        period: x.credit.period,
        resetBasis: x.credit.resetBasis,
        anniversaryMonth: userCard.anniversaryMonth,
        anniversaryDay: userCard.anniversaryDay,
      }),
    }))
    .sort((a, b) => (a.days ?? 99) - (b.days ?? 99));

  const balance = balances.find((b) => b.program === card.program);

  return (
    // Container, not viewport: how much room these widgets get depends on
    // whether the calculator panel is docked, which no breakpoint knows.
    <div className="@container min-w-0 space-y-6">
      {entries.length > 1 && (
        <CardSwitcher entries={entries} selectedId={card.id} onSelect={setStoredId} />
      )}

      {/* Keyed by card, so switching fades the new card's numbers in rather
          than swapping them under the reader's eye. */}
      <motion.div
        key={card.id}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="space-y-6"
      >
        <div className="grid gap-5 @md:grid-cols-2 @3xl:grid-cols-3">
          <Widget title="Credits this year">
            {available === 0 ? (
              <p className="text-sm leading-relaxed text-muted">This card has no credits to use.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <ProgressRing
                  value={used / available}
                  size={96}
                  label={`${Math.round((used / available) * 100)}%`}
                />
                <div className="min-w-0">
                  <p className="text-2xl leading-none">{money(used)}</p>
                  <p className="mt-1.5 text-sm leading-snug text-muted">
                    used of {usd(available)} this card offers
                  </p>
                </div>
              </div>
            )}
          </Widget>

          <Widget title="Resetting soon">
            {expiring.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted">
                Nothing on this card resets in the next month.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {expiring.slice(0, 4).map(({ credit, state, days }) => (
                  <li key={credit.id} className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{credit.name}</p>
                      {days !== null && (
                        <p className="truncate text-[13px] text-muted">
                          {days} {days === 1 ? "day" : "days"} left
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">
                      {money(credit.amount - (state.used[state.currentIndex] ?? 0))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>

          <Widget title="Points">
            {!balance || balance.balance === 0 ? (
              <p className="text-sm leading-relaxed text-muted">
                No {PROGRAM_LABELS[card.program]} balance entered yet. Add it on the{" "}
                <Link
                  href="/points"
                  className="rounded-inner text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Points page
                </Link>
                .
              </p>
            ) : (
              <div>
                <p className="text-2xl leading-none tabular-nums">
                  {usd(pointsValue(balance.balance, valuations[card.program] ?? 1))}
                </p>
                <p className="mt-1.5 text-sm leading-snug text-muted">
                  {pts(balance.balance)} {PROGRAM_LABELS[card.program]}
                </p>
              </div>
            )}
          </Widget>
        </div>

        <CardCredits card={card} userCard={userCard} usage={usage} />
      </motion.div>
    </div>
  );
}

/**
 * The first visit: which card to look at. The cards arrive one after
 * another, a few frames apart, so the choice reads as a hand of cards to
 * pick from rather than a page that has loaded.
 */
function ChooseCard({
  entries,
  usage,
  onChoose,
}: {
  entries: WalletEntry[];
  usage: CreditUsage;
  onChoose: (cardId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="choose-card" className="@container min-w-0">
      <h2 id="choose-card" className="font-display text-2xl leading-tight">
        Which card do you want to track?
      </h2>
      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">
        Each card&apos;s credits, fee and points show on their own. You can switch cards at any
        time.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 @2xl:grid-cols-3">
        {entries.map(({ card, userCard }, i) => {
          const value = cardAnnualCreditValue(card);
          const used = liveCredits(card.credits).reduce(
            (s, c) => s + creditState(c, userCard, usage).usedTotal,
            0,
          );
          return (
            <motion.li
              key={card.id}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translateY(10px) scale(0.97)" }
              }
              animate={
                reduceMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" }
              }
              transition={{ duration: 0.26, delay: Math.min(i, 8) * 0.045, ease: EASE_OUT }}
              className="min-w-0"
            >
              <button
                type="button"
                onClick={() => onChoose(card.id)}
                className="block w-full rounded-inner text-left transition-transform duration-[var(--cd-dur-press)] ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
              >
                <CardFace card={card} interactive priority={i < 2} sizes="(max-width: 768px) 45vw, 240px" />
                <span className="mt-2.5 block truncate text-[15px] font-medium">
                  {userCard.nickname ?? card.name}
                </span>
                <span className="block text-[13px] text-muted">
                  {value === 0 ? "No credits" : `${money(used)} of ${usd(value)} used`}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One row of small cards above the stats, one tap to change. A radio group:
 * one tab stop, arrow keys move and choose. It scrolls sideways on a phone
 * rather than wrapping, so it stays one line however many cards there are.
 */
function CardSwitcher({
  entries,
  selectedId,
  onSelect,
}: {
  entries: WalletEntry[];
  selectedId: string;
  onSelect: (cardId: string) => void;
}) {
  const index = entries.findIndex((e) => e.card.id === selectedId);
  const { onKeyDown, itemProps } = useRovingFocus(entries.length, index, (i) =>
    onSelect(entries[i].card.id),
  );
  return (
    <div className="-mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0.5">
      <div
        role="radiogroup"
        aria-label="Card to track"
        onKeyDown={onKeyDown}
        className="flex w-max gap-2"
      >
        {entries.map(({ card, userCard }, i) => {
          const on = card.id === selectedId;
          return (
            <button
              key={card.id}
              {...itemProps(i)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(card.id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-inner border py-1.5 pr-3.5 pl-1.5 text-left",
                "transition-[border-color,background-color,transform] duration-[var(--cd-dur-press)] ease-out active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                on ? "border-ink bg-surface" : "border-line hover:border-muted",
              )}
            >
              <span className="w-12 shrink-0">
                <CardFace card={card} sizes="48px" />
              </span>
              <span className={cn("max-w-[160px] truncate text-[14px]", on ? "font-medium" : "text-muted")}>
                {userCard.nickname ?? card.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardCredits({
  card,
  userCard,
  usage,
}: {
  card: Card;
  userCard: UserCard;
  usage: CreditUsage;
}) {
  const [customizing, setCustomizing] = useState(false);
  const { shown, hidden } = arrangeCredits(liveCredits(card.credits), userCard.prefs);
  const available = shown.reduce((s, c) => s + creditState(c, userCard, usage).available, 0);
  const used = shown.reduce((s, c) => s + creditState(c, userCard, usage).usedTotal, 0);
  const autofill = userCard.prefs?.autofill ?? {};

  if (card.credits.length === 0) {
    return (
      <Widget title={userCard.nickname ?? card.name}>
        <p className="text-sm leading-relaxed text-muted">
          No credits to track on this card.
          {card.annualFee === 0
            ? " It has no annual fee either, so there is nothing to earn back."
            : ` Its ${usd(card.annualFee)} fee has to be earned back through points alone.`}
        </p>
      </Widget>
    );
  }

  return (
    <Widget
      title={userCard.nickname ?? card.name}
      action={
        <div className="flex items-center gap-3">
          <p className="text-sm tabular-nums text-muted max-sm:hidden">
            {money(used)} of {usd(available)}
          </p>
          <Button variant="outline" size="sm" onClick={() => setCustomizing(true)}>
            <SlidersHorizontalIcon size={15} />
            Customize
          </Button>
        </div>
      }
    >
      <FeeBar annualFee={card.annualFee} creditsUsed={used} />

      {card.credits.some((c) => c.resetBasis === "anniversary") && (
        <AnniversaryField userCard={userCard} cardName={userCard.nickname ?? card.name} />
      )}

      <ul className="mt-6 space-y-6">
        {shown.map((credit) => (
          <CreditRow
            key={credit.id}
            credit={credit}
            anniversary={userCard}
            usage={usage}
            tint={creditTint(credit, userCard.prefs)}
            autoFill={Boolean(autofill[credit.id])}
          />
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="mt-6 text-sm text-muted">Every credit on this card is hidden.</p>
      )}
      {hidden.length > 0 && (
        <p className="mt-6 text-[13px] text-muted">
          {hidden.length} hidden.{" "}
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Show them in Customize
          </button>
        </p>
      )}

      <p className="mt-6 text-[13px] text-muted">
        Last checked {longDate(card.lastVerified)}. Confirm with {card.issuer}.
      </p>

      <CustomizeDrawer card={card} userCard={userCard} open={customizing} onOpenChange={setCustomizing} />
    </Widget>
  );
}

/**
 * When the card's anniversary credits reset. The date the card was opened
 * sets the day (Venture X's travel credit renews on the exact date), not
 * just the month. Until someone sets it, they reset on the 1st.
 */
function AnniversaryField({ userCard, cardName }: { userCard: UserCard; cardName: string }) {
  const id = useId();
  const day = userCard.anniversaryDay;
  const month = monthName(userCard.anniversaryMonth);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-inner bg-bg px-3.5 py-2.5">
      <p className="text-[13px] leading-snug">
        <span className="text-muted">Anniversary credits reset on </span>
        <span className="font-medium">
          {month} {day ?? 1}
        </span>
        {!day && <span className="text-muted">. Set the date you opened the card for the exact day.</span>}
      </p>
      <label htmlFor={id} className="flex items-center gap-2 text-[13px] text-muted">
        Opened on
        <input
          id={id}
          type="date"
          aria-label={`Date you opened ${cardName}`}
          value={day ? userCard.openedOn : ""}
          max={localDate(new Date())}
          onChange={(e) => {
            if (e.target.value) void setAnniversary(userCard.cardId, e.target.value);
          }}
          className="h-8 rounded-control border border-line bg-surface px-2 text-[16px] md:text-[13px] text-ink tabular-nums transition-[border-color] duration-[var(--cd-dur-hover)] ease-out hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
        />
      </label>
    </div>
  );
}

/**
 * Is the fee worth it? Credits recovered against the fee, as one bar.
 * Deliberately not a ring: this is a single ratio, and a bar reads as
 * "how far along" faster at a glance.
 */
function FeeBar({
  annualFee,
  creditsUsed,
}: {
  annualFee: number;
  creditsUsed: number;
}) {
  if (annualFee === 0) {
    return (
      <p className="text-sm text-muted">
        No annual fee, so every credit you use is straight profit.
      </p>
    );
  }

  const ratio = Math.min(1, creditsUsed / annualFee);
  const covered = ratio >= 1;
  const remaining = Math.max(0, annualFee - creditsUsed);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm">
          {covered ? (
            <>Credits have covered the {usd(annualFee)} fee.</>
          ) : (
            <>
              <span className="font-medium">{money(remaining)}</span>
              <span className="text-muted">
                {" "}
                of the {usd(annualFee)} fee still to earn back.
              </span>
            </>
          )}
        </p>
        {!covered && remaining > annualFee * 0.6 && (
          <WarningCircleIcon
            size={17}
            className="shrink-0 text-muted"
            aria-label="Well short of the fee"
          />
        )}
      </div>
      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-pill bg-bg"
        role="img"
        aria-label={`${Math.round(ratio * 100)} percent of the annual fee recovered`}
      >
        {/* Scaled, not sized: width would relayout on every frame. The
            rounded ends squash slightly at small ratios, which at this
            height nobody can see. */}
        <div
          className={cn(
            "h-full origin-left rounded-pill transition-transform duration-[var(--cd-dur-panel)] ease-out",
            covered ? "bg-[var(--cd-mint-ink)]" : "bg-ink",
          )}
          style={{ transform: `scaleX(${Math.max(0.02, ratio)})` }}
        />
      </div>
    </div>
  );
}

function TrackerSkeleton() {
  return (
    <div aria-busy aria-live="polite" className="@container space-y-6">
      <span className="sr-only">Loading your tracker</span>
      <div className="grid gap-5 @md:grid-cols-2 @3xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[164px] rounded-widget border border-line bg-surface" />
        ))}
      </div>
      <div className="h-[280px] rounded-widget border border-line bg-surface" />
    </div>
  );
}
