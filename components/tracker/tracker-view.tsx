"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import type { Card, CreditPeriod, UserCard } from "@/data/types";
import { PERIOD_COUNT, PROGRAM_LABELS } from "@/data/types";
import {
  annualValue,
  cardAnnualCreditValue,
  expiringThisMonth,
  slotLabel,
  usedTotal,
} from "@/lib/credits";
import { categoryStyle } from "@/lib/categories";
import { longDate, pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  setCreditUsed,
  useCreditUsage,
  useIsLoading,
  usePointBalances,
  useValuations,
  useWallet,
} from "@/lib/data";
import { periodKeysToSlots, type CreditUsage } from "@/lib/data/schema";
import { Widget } from "@/components/ui/widget";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CheckmarkRow } from "@/components/ui/checkmark-row";

function slotsFor(
  usage: CreditUsage,
  creditId: string,
  period: CreditPeriod,
): number[] {
  return periodKeysToSlots(usage[creditId], period, PERIOD_COUNT[period]);
}

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

  const allCredits = entries.flatMap(({ card }) =>
    card.credits.map((credit) => ({ card, credit })),
  );

  const available = allCredits.reduce(
    (s, { credit }) => s + annualValue(credit),
    0,
  );
  const used = allCredits.reduce(
    (s, { credit }) =>
      s + usedTotal(slotsFor(usage, credit.id, credit.period)),
    0,
  );

  const expiring = allCredits.filter(
    ({ credit }) =>
      expiringThisMonth(credit) &&
      usedTotal(slotsFor(usage, credit.id, credit.period)) <
        annualValue(credit),
  );

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
              <p className="text-2xl leading-none">{usd(used)}</p>
              <p className="mt-1.5 text-sm leading-snug text-muted">
                used of {usd(available)} your cards offer
              </p>
            </div>
          </div>
        </Widget>

        <Widget title="Expiring this month">
          {expiring.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Nothing expires this month.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {expiring.slice(0, 4).map(({ card, credit }) => (
                <li
                  key={credit.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{credit.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {card.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">
                    {usd(credit.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        <Widget title="Points">
          {balances.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              No balances entered yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {balances.map((b) => (
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
    (s, c) => s + usedTotal(slotsFor(usage, c.id, c.period)),
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
          {usd(used)} of {usd(available)}
        </p>
      }
    >
      <FeeBar annualFee={card.annualFee} creditsUsed={used} />

      <ul className="mt-6 space-y-6">
        {card.credits.map((credit) => {
          const row = slotsFor(usage, credit.id, credit.period);
          const tint = credit.category
            ? categoryStyle(credit.category).color
            : "var(--cd-text)";
          const creditUsed = usedTotal(row);
          const creditTotal = annualValue(credit);

          return (
            <li key={credit.id}>
              <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="text-[15px]">{credit.name}</p>
                  <p className="text-[13px] text-muted">
                    {usd(credit.amount)} per period, resets on the{" "}
                    {credit.resetBasis === "calendar"
                      ? "calendar year"
                      : "anniversary"}
                  </p>
                </div>
                <p className="text-[13px] tabular-nums text-muted">
                  {usd(creditUsed)} of {usd(creditTotal)}
                </p>
              </div>
              <CheckmarkRow
                period={credit.period}
                used={row}
                amount={credit.amount}
                tint={tint}
                onToggle={(i) =>
                  setCreditUsed(
                    credit.id,
                    credit.period,
                    i,
                    row[i] >= credit.amount ? 0 : credit.amount,
                  )
                }
                slotLabel={(i) => slotLabel(credit.period, i)}
              />
            </li>
          );
        })}
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
              <span className="font-medium">{usd(remaining)}</span>
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
