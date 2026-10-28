"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import type { Card, UserCard } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { cardAnnualCreditValue, creditState } from "@/lib/credits";
import { daysUntilReset } from "@/lib/credits/reset";
import { longDate, money, pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  useCreditUsage,
  useIsLoading,
  usePointBalances,
  useValuations,
  useWallet,
} from "@/lib/data";
import type { CreditUsage } from "@/lib/data/schema";
import { Widget } from "@/components/ui/widget";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CreditRow } from "@/components/tracker/credit-row";

export function TrackerView() {
  const entries = useWallet();
  const usage = useCreditUsage();
  const balances = usePointBalances();
  const valuations = useValuations();
  const isLoading = useIsLoading();

  if (isLoading) return <TrackerSkeleton />;

  if (entries.length === 0) {
    return (
      <Widget title="Nothing to track yet">
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Add a card in the Wallet and any credits it offers show up here, one
          section per card.
        </p>
      </Widget>
    );
  }

  const states = entries.flatMap(({ card, userCard }) =>
    card.credits.map((credit) => ({
      card,
      credit,
      anniversaryMonth: userCard.anniversaryMonth,
      state: creditState(credit, userCard.anniversaryMonth, usage),
    })),
  );

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
        anniversaryMonth: x.anniversaryMonth,
      }),
    }))
    .sort((a, b) => (a.days ?? 99) - (b.days ?? 99));

  return (
    // Container, not viewport: how much room these widgets get depends on
    // whether the calculator panel is docked, which no breakpoint knows.
    <div className="@container space-y-6">
      <div className="grid gap-5 @md:grid-cols-2 @3xl:grid-cols-3">
        <Widget title="Credits this year">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <ProgressRing
              value={available > 0 ? used / available : 0}
              size={96}
              label={`${Math.round(available > 0 ? (used / available) * 100 : 0)}%`}
            />
            <div className="min-w-0">
              <p className="text-2xl leading-none">{money(used)}</p>
              <p className="mt-1.5 text-sm leading-snug text-muted">
                used of {usd(available)} your cards offer
              </p>
            </div>
          </div>
        </Widget>

        <Widget title="Resetting soon">
          {expiring.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Nothing resets in the next month.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {expiring.slice(0, 4).map(({ card, credit, state, days }) => (
                <li
                  key={credit.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{credit.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {card.name}
                      {days !== null && `, ${days} ${days === 1 ? "day" : "days"} left`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">
                    {money(
                      credit.amount - (state.used[state.currentIndex] ?? 0),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        <Widget title="Points">
          {balances.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              No balances entered yet. Add them in Settings.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {balances
                .filter((b) => b.balance > 0)
                .map((b) => (
                  <li
                    key={b.program}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {PROGRAM_LABELS[b.program]}
                      </p>
                      <p className="text-[13px] tabular-nums text-muted">
                        {pts(b.balance)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">
                      {usd(pointsValue(b.balance, valuations[b.program] ?? 1))}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Widget>
      </div>

      {entries.map(({ card, userCard }) => (
        <CardCredits
          key={card.id}
          card={card}
          userCard={userCard}
          usage={usage}
        />
      ))}
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
  const available = cardAnnualCreditValue(card);
  const used = card.credits.reduce(
    (s, c) => s + creditState(c, userCard.anniversaryMonth, usage).usedTotal,
    0,
  );

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
        <p className="text-sm tabular-nums text-muted">
          {money(used)} of {usd(available)}
        </p>
      }
    >
      <FeeBar annualFee={card.annualFee} creditsUsed={used} />

      <ul className="mt-6 space-y-6">
        {card.credits.map((credit) => (
          <CreditRow
            key={credit.id}
            credit={credit}
            anniversaryMonth={userCard.anniversaryMonth}
            usage={usage}
          />
        ))}
      </ul>

      <p className="mt-6 text-[13px] text-muted">
        Sample data, last verified {longDate(card.lastVerified)}.
      </p>
    </Widget>
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
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-[var(--cd-dur-panel)] ease-out",
            covered ? "bg-[var(--cd-mint-ink)]" : "bg-ink",
          )}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
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
          <div
            key={i}
            className="h-[164px] rounded-widget border border-line bg-surface"
          />
        ))}
      </div>
      <div className="h-[280px] rounded-widget border border-line bg-surface" />
    </div>
  );
}
