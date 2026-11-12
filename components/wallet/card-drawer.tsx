"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import {
  ArmchairIcon,
  ArrowSquareOutIcon,
  BedIcon,
  CaretDownIcon,
  CrownSimpleIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SuitcaseRollingIcon,
  UsersIcon,
  XIcon,
  type IconProps,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CardFace } from "@/components/ui/card-face";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CreditConditions } from "@/components/ui/credit-conditions";
import type { Card, CardCredit, CardPerk, EarnRate, UserCard } from "@/data/types";
import { BENEFIT_HISTORY } from "@/data/benefit-history";
import { PROGRAM_LABELS } from "@/data/types";
import { rateText } from "@/data/programs";
import { capText, ChosenRateRow, RotatingRateRow } from "@/components/wallet/earn-choices";
import { CATEGORIES, CATEGORY_LABELS, categoryStyle, type Category } from "@/lib/categories";
import { longDate, monthName, pts, usd, usdExact } from "@/lib/format";
import { annualValue, cardAnnualCreditValue, liveCredits, resetPhrase } from "@/lib/credits";
import { cn } from "@/lib/cn";
import { TRACKER_CARD_KEY, useStoredValue } from "@/lib/use-stored-value";

/** Whole dollars unless there are cents ($12.95 a month is $155.40 a year). */
function money(amount: number): string {
  const cents = Math.round(amount * 100) / 100;
  return Number.isInteger(cents) ? usd(cents) : usdExact(cents);
}

/** Spend categories in the app's own order, "everything else" last. */
const order = (c: Category | undefined) => (c ? CATEGORIES.indexOf(c) : CATEGORIES.length);

/**
 * Everything about one card, as a large centred page over the Wallet
 * (owner, 6 November 2026; it was a side drawer). The card and its facts
 * lead; below them every earn rate, credit and perk, each list in the
 * app's category order so Dining always sits where Dining sat last time.
 *
 * A modal because it is a read that the Wallet behind it should not move
 * under; focus moves in on open and back to the card on close (Base UI).
 * Near full screen on a phone, a centred page from `lg`.
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
  const [, setTrackerCard] = useStoredValue(TRACKER_CARD_KEY);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            // band is dark in both themes, so the scrim dims in dark mode too.
            "fixed inset-0 z-50 bg-band/55",
            "transition-opacity duration-[var(--cd-dur-panel)] ease-out",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-2 z-50 flex flex-col overflow-hidden rounded-widget border border-line bg-surface text-ink shadow-lifted sm:inset-5",
            // From lg a centred page. Position and the entrance scale share
            // one transform, set through two variables, so the scale does
            // not throw away the centring.
            "lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[min(880px,calc(100dvh-64px))] lg:w-[min(1000px,calc(100vw-96px))]",
            "[--dlg-t:0px] lg:[--dlg-t:-50%] [--dlg-s:1]",
            "[transform:translate(var(--dlg-t),var(--dlg-t))_scale(var(--dlg-s))]",
            "transition-[opacity,transform] duration-[var(--cd-dur-panel)] ease-[var(--cd-ease-drawer)]",
            "data-starting-style:opacity-0 data-starting-style:[--dlg-s:0.96]",
            "data-ending-style:opacity-0 data-ending-style:[--dlg-s:0.96]",
            "focus-visible:outline-none",
          )}
        >
          {card && (
            <>
              <Dialog.Close
                aria-label="Close card details"
                className={cn(
                  "absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-pill border border-line bg-surface/90 text-muted backdrop-blur-sm",
                  "transition-[color,border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted hover:text-ink active:scale-[0.97]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                )}
              >
                <XIcon size={18} />
              </Dialog.Close>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--cd-border)_transparent] [scrollbar-width:thin]">
                <Details card={card} userCard={userCard} onTracker={() => setTrackerCard(card.id)} />
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Details({
  card,
  userCard,
  onTracker,
}: {
  card: Card;
  userCard?: UserCard;
  onTracker: () => void;
}) {
  const perks = card.perks ?? [];
  const hasLoungePerk = perks.some((p) => p.kind === "lounge");
  const annualCreditValue = cardAnnualCreditValue(card);
  const credits = [...liveCredits(card.credits)].sort((a, b) => order(a.category) - order(b.category));
  const rates = [...card.earnRates].sort((a, b) => order(a.category) - order(b.category));

  return (
    <>
      {/* The card and its facts. Asymmetric: the face is the anchor, the
          name and numbers sit beside it. */}
      <header className="grid gap-6 border-b border-line px-5 pt-6 pb-7 sm:px-8 sm:pt-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-end md:gap-9">
        <div className="max-w-[300px] pr-12 md:pr-0">
          <CardFace card={card} priority sizes="(max-width: 768px) 80vw, 300px" />
        </div>
        <div className="min-w-0 md:pr-10">
          <Dialog.Title className="font-display text-[30px] leading-[1.05] tracking-[-0.03em] text-balance sm:text-[36px]">
            {userCard?.nickname ?? card.name}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-[15px] text-muted">
            {card.issuer}
            {userCard?.nickname ? `, ${card.name}` : ""}
          </Dialog.Description>

          {card.pending ? null : (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[15px] sm:grid-cols-4">
              <Fact
                label="Annual fee"
                value={
                  card.annualFee === 0
                    ? "None"
                    : card.firstYearFee !== undefined
                      ? `${card.firstYearFee === 0 ? "None" : usd(card.firstYearFee)} the first year, then ${usd(card.annualFee)}`
                      : usd(card.annualFee)
                }
              />
              <Fact label="Earns" value={PROGRAM_LABELS[card.program]} />
              <Fact
                label="Abroad"
                value={
                  card.foreignTransactionFee === null
                    ? "Fee not stated"
                    : card.foreignTransactionFee === 0
                      ? "No foreign fee"
                      : `${card.foreignTransactionFee}% fee`
                }
              />
              {userCard ? (
                <Fact
                  label="Anniversary"
                  value={`${monthName(userCard.anniversaryMonth)} ${userCard.anniversaryDay ?? 1}`}
                />
              ) : annualCreditValue > 0 ? (
                <Fact label="Credits" value={`${usd(annualCreditValue)} a year`} />
              ) : null}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {userCard && !card.pending && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/tracker" onClick={onTracker} />}
              >
                <ListChecksIcon size={15} />
                Open tracker
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<a href={card.issuerUrl} target="_blank" rel="noreferrer noopener" />}
            >
              {card.issuer}&apos;s page
              <ArrowSquareOutIcon size={15} />
            </Button>
          </div>
        </div>
      </header>

      {card.pending ? (
        <section className="px-5 py-10 sm:px-8">
          <h3 className="text-[17px] font-medium">Details coming soon</h3>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">
            This card&apos;s earn rates, credits and fee are not in CreditDash yet.
            It stays in your wallet, and everything here fills in once they are
            added, with nothing for you to redo.
          </p>
        </section>
      ) : (
        <div className="space-y-10 px-5 py-8 sm:px-8 sm:py-9">
          <Section title="How it earns" aside={PROGRAM_LABELS[card.program]}>
            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {rates.map((rate) => (
                <EarnRow key={rate.category} rate={rate} program={card.program} />
              ))}
              {card.chosenRates?.map((rate) => (
                <ChosenRateRow key={rate.id} card={card} rate={rate} editable={Boolean(userCard)} />
              ))}
              {card.rotatingRates?.map((rate) => (
                <RotatingRateRow key={rate.id} card={card} rate={rate} />
              ))}
            </ul>
            {card.anniversaryBonus && (
              <p className="mt-4 text-[13px] text-muted">
                Plus {pts(card.anniversaryBonus.points)} {card.anniversaryBonus.unit} every card
                anniversary, posted automatically.
              </p>
            )}
          </Section>

          <Section
            title="Credits"
            aside={annualCreditValue > 0 ? `${usd(annualCreditValue)} a year` : undefined}
          >
            {credits.length === 0 ? (
              <p className="border-t border-line pt-4 text-[15px] text-muted">
                This card has no credits to track.
              </p>
            ) : (
              <ul className="grid gap-x-10 lg:grid-cols-2">
                {credits.map((credit) => (
                  <CreditItem key={credit.id} credit={credit} card={card} userCard={userCard} />
                ))}
              </ul>
            )}
          </Section>

          {(perks.length > 0 || (card.loungeAccess && !hasLoungePerk)) && (
            <Section title="Perks">
              <ul className="grid gap-x-10 lg:grid-cols-2">
                {perks.map((perk) => (
                  <PerkItem key={perk.id} perk={perk} />
                ))}
                {card.loungeAccess && !hasLoungePerk && (
                  <PerkItem perk={{ id: "lounge", name: card.loungeAccess, kind: "lounge" }} />
                )}
              </ul>
            </Section>
          )}

          {card.finePrint && card.finePrint.length > 0 && (
            <Section title="Worth knowing">
              <ul className="grid gap-x-10 text-[14px] leading-relaxed text-muted lg:grid-cols-2">
                {card.finePrint.map((line) => (
                  <li key={line} className="border-t border-line py-3">
                    {line}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      <footer className="border-t border-line px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
        <p className="max-w-[80ch] text-[13px] leading-relaxed text-muted">
          {card.pending ? "Added" : "Last checked"} {longDate(card.lastVerified)}
          {card.sourceUrl ? (
            <>
              {" "}against{" "}
              <a href={card.sourceUrl} target="_blank" rel="noreferrer noopener" className={LINK}>
                {card.issuer}&apos;s benefit terms
              </a>
            </>
          ) : null}
          . Benefits change often, so confirm anything that matters with {card.issuer} before
          you rely on it.{" "}
          <a
            href={`mailto:hello@creditdash.co?subject=${encodeURIComponent(`Mistake on ${card.name}`)}`}
            className={LINK}
          >
            Report a mistake
          </a>
          .
        </p>
      </footer>
    </>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <h3 className="text-[17px] font-medium tracking-[-0.01em]">{title}</h3>
        {aside && <p className="text-[13px] text-muted">{aside}</p>}
      </div>
      {children}
    </section>
  );
}

/** The category's own pastel tile, so a rate is found by colour before it is read. */
function CategoryTile({ category, size = "lg" }: { category: Category; size?: "lg" | "sm" }) {
  return (
    <span
      aria-hidden
      style={categoryStyle(category)}
      className={cn(
        "grid shrink-0 place-items-center rounded-inner",
        size === "lg" ? "size-11" : "size-9",
        category === "other" && "border border-line",
      )}
    >
      <CategoryIcon category={category} size={size === "lg" ? 22 : 18} />
    </span>
  );
}

/**
 * One earn rate: the best rate large, then where it applies, the anywhere
 * rate under a boost (owner, 2 November 2026), and any cap or condition.
 */
function EarnRow({ rate, program }: { rate: EarnRate; program: Card["program"] }) {
  const best = rate.boost ? Math.max(rate.multiplier, rate.boost.multiplier) : rate.multiplier;
  const detail = rate.boost
    ? [
        `${rate.boost.where.charAt(0).toUpperCase()}${rate.boost.where.slice(1)}.`,
        rate.notes ? `${rate.notes}.` : null,
        `${rateText(program, rate.multiplier)} elsewhere.`,
      ]
    : rate.notes
      ? // Older notes state their yearly cap in words; a quarterly or shared
        // cap is newer and easy to miss, so it is added beside the note.
        [`${rate.notes}.`, rate.capPeriod === "quarter" || rate.capGroup ? capText(rate) : null]
      : [capText(rate) || "No cap."];

  return (
    <li className="flex gap-4 border-t border-line py-4">
      <CategoryTile category={rate.category} />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[28px] leading-none tracking-[-0.03em] tabular-nums">
            {rateText(program, best)}
          </span>
          <span className="text-[15px] font-medium">{CATEGORY_LABELS[rate.category]}</span>
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{detail.filter(Boolean).join(" ")}</p>
      </div>
    </li>
  );
}

function CreditItem({
  credit,
  card,
  userCard,
}: {
  credit: CardCredit;
  card: Card;
  userCard?: UserCard;
}) {
  return (
    <li className="flex gap-4 border-t border-line py-4">
      <CategoryTile category={credit.category ?? "other"} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-medium">{credit.name}</p>
          {/* The year's total leads; the amount per period is under it
              (owner, 5 November 2026). */}
          <span className="shrink-0 text-[15px] tabular-nums">{money(annualValue(credit))}</span>
        </div>
        <CreditConditions credit={credit} className="mt-1" />
        <p className="mt-1 text-[13px] text-muted">
          {money(credit.amount)}{" "}
          {userCard || credit.resetBasis === "calendar"
            ? resetPhrase(credit, userCard ?? { anniversaryMonth: 1 })
            : `${PER[credit.period]}, resets from your card anniversary`}
        </p>
        {credit.notes && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{credit.notes}</p>}
        <BenefitDetails credit={credit} card={card} />
      </div>
    </li>
  );
}

const PERK_ICONS: Record<CardPerk["kind"], React.ComponentType<IconProps>> = {
  lounge: ArmchairIcon,
  status: CrownSimpleIcon,
  "free-night": BedIcon,
  companion: UsersIcon,
  bags: SuitcaseRollingIcon,
  protection: ShieldCheckIcon,
  other: SparkleIcon,
};

function PerkItem({ perk }: { perk: CardPerk }) {
  const Icon = PERK_ICONS[perk.kind] ?? SparkleIcon;
  return (
    <li className="flex gap-4 border-t border-line py-4">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-inner bg-panel text-ink">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-medium">{perk.name}</p>
        {perk.notes && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{perk.notes}</p>}
      </div>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
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
