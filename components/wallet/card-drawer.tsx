"use client";

import Link from "next/link";
import { ArrowSquareOutIcon, CaretDownIcon, ListChecksIcon } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CardFace } from "@/components/ui/card-face";
import { EarnChip } from "@/components/ui/earn-chip";
import { CreditConditions } from "@/components/ui/credit-conditions";
import type { Card, CardCredit, UserCard } from "@/data/types";
import { BENEFIT_HISTORY } from "@/data/benefit-history";
import { PROGRAM_LABELS } from "@/data/types";
import { longDate, monthName, pts, usd, usdExact } from "@/lib/format";
import { annualValue, cardAnnualCreditValue, liveCredits, resetPhrase } from "@/lib/credits";
import { useIsDesktop } from "@/lib/use-media-query";
import { TRACKER_CARD_KEY, useStoredValue } from "@/lib/use-stored-value";


/** Whole dollars unless there are cents ($12.95 a month is $155.40 a year). */
function money(amount: number): string {
  const cents = Math.round(amount * 100) / 100;
  return Number.isInteger(cents) ? usd(cents) : usdExact(cents);
}

/**
 * Everything about one card. A panel on the right at desktop width, a bottom
 * sheet on a phone, both from the same Base UI drawer so swipe-to-dismiss
 * behaves the same way it entered.
 */
export function CardDrawer({
  card,
  userCard,
  open,
  onOpenChange,
}: {
  card: Card | null;
  userCard?: UserCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const [, setTrackerCard] = useStoredValue(TRACKER_CARD_KEY);

  if (!card) return null;

  const perks = card.perks ?? [];
  const hasLoungePerk = perks.some((p) => p.kind === "lounge");

  const annualCreditValue = cardAnnualCreditValue(card);
  const credits = liveCredits(card.credits);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="data-[swipe-direction=right]:sm:[--drawer-content-width:30rem]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <DrawerHeader className="gap-0 px-5 pt-5 pb-0 text-left">
            <div className="mb-5 max-w-[260px]">
              <CardFace card={card} sizes="(max-width: 768px) 92vw, 280px" />
            </div>
            <DrawerTitle className="font-display text-[26px] leading-tight">
              {userCard?.nickname ?? card.name}
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-[15px] text-muted">
              {card.issuer}
              {userCard?.nickname ? ` · ${card.name}` : ""}
            </DrawerDescription>
            {userCard && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 self-start"
                nativeButton={false}
                render={<Link href="/tracker" onClick={() => setTrackerCard(card.id)} />}
              >
                <ListChecksIcon size={15} />
                Open tracker
              </Button>
            )}
          </DrawerHeader>

          <div className="space-y-7 px-5 py-6">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <Fact label="Annual fee" value={card.annualFee === 0 ? "None" : usd(card.annualFee)} />
              <Fact label="Points program" value={PROGRAM_LABELS[card.program]} />
              <Fact
                label="Foreign transactions"
                value={card.foreignTransactionFee === 0 ? "No fee" : `${card.foreignTransactionFee}%`}
              />
              {userCard && (
                <Fact
                  label="Anniversary"
                  value={`${monthName(userCard.anniversaryMonth)}${userCard.anniversaryDay ? ` ${userCard.anniversaryDay}` : ""}`}
                />
              )}
              {card.loungeAccess && !hasLoungePerk && (
                <Fact label="Lounges" value={card.loungeAccess} className="col-span-2" />
              )}
            </dl>

            <section>
              <h3 className="mb-3 text-sm font-medium">Earn rates</h3>
              <ul className="space-y-2">
                {card.earnRates.map((rate) => (
                  <li
                    key={rate.category}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-2 last:border-0 last:pb-0"
                  >
                    {rate.boost ? (
                      // The best rate leads, with where it applies; the
                      // anywhere rate is the subtext (owner, 2 November 2026).
                      <>
                        <EarnChip category={rate.category} multiplier={rate.boost.multiplier} />
                        <span className="w-full text-[13px] leading-relaxed">
                          {rate.boost.where.charAt(0).toUpperCase() + rate.boost.where.slice(1)}
                          {rate.notes ? `. ${rate.notes}.` : "."}{" "}
                          <span className="text-muted">{rate.multiplier}x elsewhere.</span>
                        </span>
                      </>
                    ) : (
                      <EarnChip category={rate.category} multiplier={rate.multiplier} />
                    )}
                    {rate.boost ? null : (
                      <span className="text-[13px] text-muted">
                        {rate.notes ?? (rate.cap ? `Up to ${usd(rate.cap)} a year` : "No cap")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium">Credits</h3>
                {annualCreditValue > 0 && (
                  <p className="text-[13px] text-muted">
                    {usd(annualCreditValue)} a year
                  </p>
                )}
              </div>
              {credits.length === 0 ? (
                <p className="text-sm text-muted">
                  This card has no credits to track.
                </p>
              ) : (
                <ul className="space-y-3">
                  {credits.map((credit) => (
                    <li
                      key={credit.id}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm">
                          {credit.name} <CreditConditions credit={credit} className="ml-1" />
                        </p>
                        <p className="text-[13px] text-muted">
                          {money(credit.amount)}{" "}
                          {userCard || credit.resetBasis === "calendar"
                            ? resetPhrase(credit, userCard ?? { anniversaryMonth: 1 })
                            : `${PER[credit.period]}, resets from your card anniversary`}
                        </p>
                        {credit.notes && (
                          <p className="mt-0.5 text-[13px] text-muted">{credit.notes}</p>
                        )}
                        <BenefitDetails credit={credit} card={card} />
                      </div>
                      {/* The year's total leads; the amount per period is the
                          subtext (owner, 5 November 2026). */}
                      <span className="shrink-0 text-sm tabular-nums">
                        {money(annualValue(credit))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {card.anniversaryBonus && (
                <p className="mt-3 text-[13px] text-muted">
                  Plus {pts(card.anniversaryBonus.points)} {card.anniversaryBonus.unit} every card
                  anniversary, posted automatically.
                </p>
              )}
            </section>

            {perks.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-medium">Perks</h3>
                <ul className="space-y-2">
                  {perks.map((perk) => (
                    <li key={perk.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
                      <p className="text-sm">{perk.name}</p>
                      {perk.notes && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{perk.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {card.finePrint && card.finePrint.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-medium">Worth knowing</h3>
                <ul className="space-y-2 text-[13px] leading-relaxed text-muted">
                  {card.finePrint.map((line) => (
                    <li key={line} className="border-b border-line pb-2 last:border-0 last:pb-0">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-[13px] leading-relaxed text-muted">
              Last checked {longDate(card.lastVerified)}
              {card.sourceUrl ? (
                <>
                  {" "}against{" "}
                  <a
                    href={card.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-control text-ink underline decoration-line underline-offset-4 transition-[text-decoration-color] duration-[var(--cd-dur-hover)] ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {card.issuer}&apos;s benefit terms
                  </a>
                </>
              ) : null}
              . Benefits change often, so confirm anything that matters with{" "}
              {card.issuer} before you rely on it.
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            className="flex-1"
            nativeButton={false}
            render={
              <a href={card.issuerUrl} target="_blank" rel="noreferrer noopener" />
            }
          >
            Open {card.issuer}
            <ArrowSquareOutIcon size={16} />
          </Button>
          <DrawerClose render={<Button variant="ghost">Close</Button>} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Fact({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

const PER: Record<CardCredit["period"], string> = {
  monthly: "a month",
  quarterly: "a quarter",
  semiannual: "twice a year",
  annual: "a year",
};

const LINK =
  "rounded-control text-ink underline decoration-line underline-offset-4 transition-[text-decoration-color] duration-[var(--cd-dur-hover)] ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * Where a credit's facts come from, when they were last checked, what it
 * takes to get it, and what has changed in our record of it (owner,
 * 6 November 2026). Folded by default: most people want the amount, and
 * this is for when it matters.
 */
function BenefitDetails({ credit, card }: { credit: CardCredit; card: Card }) {
  const source = credit.sourceUrl ?? card.sourceUrl ?? card.issuerUrl;
  const checked = credit.lastVerified ?? card.lastVerified;
  const history = BENEFIT_HISTORY[credit.id] ?? [];
  const conditions = [
    credit.enroll && `Enroll in your ${card.issuer} account before you use it.`,
    credit.spendToUnlock && `Paid only after ${usd(credit.spendToUnlock)} of spend on the card in a calendar year.`,
    credit.endsOn && `Limited time: ends ${longDate(credit.endsOn)} and does not renew.`,
  ].filter((c): c is string => Boolean(c));

  return (
    <details className="group mt-1.5 text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-control text-muted transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
        Source and history
        <CaretDownIcon
          size={12}
          aria-hidden
          className="transition-transform duration-[var(--cd-dur-menu)] ease-out group-open:rotate-180"
        />
      </summary>
      <dl className="mt-2 space-y-2 rounded-inner bg-bg px-3 py-2.5 leading-relaxed">
        <div>
          <dt className="text-muted">Source</dt>
          <dd>
            <a href={source} target="_blank" rel="noreferrer noopener" className={LINK}>
              {credit.sourceUrl || card.sourceUrl ? `${card.issuer}'s benefit terms` : `${card.issuer}'s card page`}
            </a>
            <span className="text-muted">, checked {longDate(checked)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">To get it</dt>
          {conditions.length === 0 ? (
            <dd>Nothing to do beyond holding the card{credit.notes ? ", within the terms above" : ""}.</dd>
          ) : (
            conditions.map((c) => <dd key={c}>{c}</dd>)
          )}
        </div>
        <div>
          <dt className="text-muted">Changes to this entry</dt>
          {history.length === 0 ? (
            <dd>None since it was first checked.</dd>
          ) : (
            [...history].reverse().map((h) => (
              <dd key={h.date + h.change}>
                <span className="tabular-nums text-muted">{longDate(h.date)}:</span> {h.change}
              </dd>
            ))
          )}
        </div>
      </dl>
    </details>
  );
}
