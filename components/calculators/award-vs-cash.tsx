"use client";

import { useId, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { Card, Program } from "@/data/types";
import { PROGRAM_GROUP, PROGRAM_LABELS } from "@/data/programs";
import { getCard } from "@/data/cards.seed";
import { awardVsCash, rateFor, rewardsOnPurchase } from "@/lib/calculators/engine";
import { useTrackedPrograms, useValuation, useValuations } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cents, money } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  CardSelect,
  NotAdvice,
  NumberField,
  ProgramSelect,
  Segmented,
  Verdict,
} from "@/components/calculators/fields";
import { ValuationTag } from "@/components/points/valuation-tag";

type Booking = "flights" | "hotels";

const VERDICT_TITLE = {
  "use-points": "Use points",
  "pay-cash": "Pay cash",
  "close-call": "Close call",
} as const;

/** Pay with points or with cash? The answer, and the arithmetic behind it. */
export function AwardVsCashCalculator({ cards }: { cards: Card[] }) {
  const tracked = useTrackedPrograms();
  const [program, setProgram] = useState<Program>(
    tracked[0] ?? cards[0]?.program ?? "chase-ur",
  );
  const [cash, setCash] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [fees, setFees] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [rewardCardId, setRewardCardId] = useState("");
  const [booking, setBooking] = useState<Booking>(
    PROGRAM_GROUP[program] === "hotel" ? "hotels" : "flights",
  );
  const [typedRewards, setTypedRewards] = useState<number | null>(null);
  const moreId = useId();

  const { cpp } = useValuation(program);
  const valuations = useValuations();
  const rewardCard = rewardCardId ? getCard(rewardCardId) : undefined;
  const rewardCpp = rewardCard ? (valuations[rewardCard.program] ?? 0) : 0;
  const cardRewards = rewardCard
    ? rewardsOnPurchase(rewardCard, booking, cash ?? 0, rewardCpp)
    : 0;
  const rewardsForgone = typedRewards ?? cardRewards;

  const result = awardVsCash({
    cashPrice: cash,
    points,
    fees,
    rewardsForgone,
    valuation: cpp,
  });

  function pickProgram(next: Program) {
    setProgram(next);
    setBooking(PROGRAM_GROUP[next] === "hotel" ? "hotels" : "flights");
  }

  return (
    <div className="@container">
      <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:gap-8">
        <div className="space-y-4">
          <ProgramSelect
            label="Points program"
            tracked={tracked}
            value={program}
            onChange={pickProgram}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField kind="money" label="Cash price" value={cash} onValue={setCash} />
            <NumberField
              kind="points"
              label="Points needed"
              value={points}
              onValue={setPoints}
            />
          </div>
          <NumberField
            kind="money"
            label="Taxes and fees on the award"
            value={fees}
            onValue={setFees}
          />

          <div>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={moreId}
              onClick={() => setMoreOpen((o) => !o)}
              className="flex h-8 items-center gap-1.5 rounded-control text-[13px] font-medium text-ink transition-[color,transform] duration-[var(--cd-dur-press)] ease-out hover:text-muted active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <CaretDownIcon
                size={14}
                aria-hidden
                className={cn(
                  "transition-transform duration-[var(--cd-dur-menu)] ease-out",
                  moreOpen && "rotate-180",
                )}
              />
              More detail
              {rewardsForgone > 0 && !moreOpen && (
                <span className="font-normal text-muted">
                  , {money(round2(rewardsForgone))} in rewards counted
                </span>
              )}
            </button>
            <div id={moreId} hidden={!moreOpen} className="mt-3 space-y-3 rounded-inner border border-line p-4">
              <p className="text-[13px] leading-relaxed text-muted">
                Paying cash earns rewards that points do not, so those come off what
                the points save you.
              </p>
              <CardSelect
                label="Card you would pay with"
                wallet={cards}
                value={rewardCardId}
                onChange={setRewardCardId}
                allowNone
                noneLabel="No card"
              />
              {rewardCard && (
                <>
                  <Segmented<Booking>
                    label="Booking"
                    value={booking}
                    onChange={setBooking}
                    options={[
                      { value: "flights", label: "Flight" },
                      { value: "hotels", label: "Hotel" },
                    ]}
                  />
                  <p className="text-[13px] leading-relaxed text-muted">
                    {rewardCard.name} earns {rateFor(rewardCard, booking).multiplier}x on{" "}
                    {CATEGORY_LABELS[booking].toLowerCase()}
                    {cash ? <>, about {money(round2(cardRewards))} on this booking</> : null}.
                    {rateFor(rewardCard, booking).notes && (
                      <> {rateFor(rewardCard, booking).notes}.</>
                    )}
                  </p>
                </>
              )}
              <NumberField
                kind="money"
                label="Or type the rewards yourself"
                hint="Used instead of the card's figure when filled in."
                value={typedRewards}
                onValue={setTypedRewards}
              />
            </div>
          </div>
        </div>

        <div className="@2xl:sticky @2xl:top-4 @2xl:self-start">
          <AwardResult result={result} program={program} cpp={cpp} />
          <ValuationTag program={program} className="mt-2" />
        </div>
      </div>

      <NotAdvice>Award prices and fees change. Check them before you book.</NotAdvice>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function AwardResult({
  result,
  program,
  cpp,
}: {
  result: ReturnType<typeof awardVsCash>;
  program: Program;
  cpp: number;
}) {
  if (result.kind === "empty") {
    return (
      <Verdict title="Points or cash?">
        Enter the cash price and the points the same booking costs.
      </Verdict>
    );
  }

  if (result.kind === "fees-exceed") {
    return (
      <Verdict title="Pay cash">The award costs more in fees than the ticket.</Verdict>
    );
  }

  const ahead = result.difference >= 0;
  return (
    <Verdict title={VERDICT_TITLE[result.verdict]}>
      <p>
        You&apos;re getting{" "}
        <span className="font-medium text-ink tabular-nums">
          {cents(result.centsPerPoint)}
        </span>{" "}
        per point. {PROGRAM_LABELS[program]} points are worth {cents(cpp)} to you.
      </p>
      <dl className="mt-3 divide-y divide-line text-[13px]">
        <div className="flex justify-between gap-4 py-1.5">
          <dt>Cash you keep by using points</dt>
          <dd className="tabular-nums text-ink">{money(round2(result.cashSaved))}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt>What those points are worth</dt>
          <dd className="tabular-nums text-ink">{money(round2(result.pointsValue))}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt>{ahead ? "Points come out ahead by" : "Cash comes out ahead by"}</dt>
          <dd className="tabular-nums font-medium text-ink">
            {money(round2(Math.abs(result.difference)))}
          </dd>
        </div>
      </dl>
    </Verdict>
  );
}
