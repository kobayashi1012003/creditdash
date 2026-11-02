"use client";

import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { CARDS } from "@/data/cards.seed";
import { reviewCatalog, STALE_AFTER_DAYS } from "@/lib/catalog-review";
import { useAccount, useIsLoading } from "@/lib/data";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";

/**
 * The catalog as the owner reviews it: every card, how long since it was
 * checked against its issuer, and the terms page it was checked against.
 * Read-only. The catalog lives in data/cards.seed.ts; this page says what
 * needs another look, it does not edit anything.
 *
 * Shown only to an account with `profiles.is_admin`. The catalog is public
 * anyway, so the check keeps the page out of everyone's way rather than
 * protecting anything.
 */
export function CatalogReview() {
  const account = useAccount();
  const isLoading = useIsLoading();

  if (isLoading) {
    return (
      <div aria-busy aria-live="polite" className="h-[420px] rounded-widget border border-line bg-surface">
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!account?.isAdmin) {
    return (
      <Widget title="This page is for the site owner">
        <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">
          {account
            ? "This account is not set up as an admin."
            : "Sign in with the owner's account to see it."}
        </p>
        <Button className="mt-5" nativeButton={false} render={<Link href="/wallet" />}>
          Go to Wallet
        </Button>
      </Widget>
    );
  }

  const rows = reviewCatalog(CARDS);
  const due = rows.filter((r) => r.stale).length;
  const withTerms = rows.filter((r) => r.source).length;

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed">
        <span className="font-medium">
          {due === 0 ? "Nothing is due for a check." : `${due} ${due === 1 ? "card is" : "cards are"} due for a check.`}
        </span>{" "}
        <span className="text-muted">
          {rows.length} cards, {withTerms} checked against the issuer&apos;s own terms page.
          A card is due {STALE_AFTER_DAYS} days after its last check.
        </span>
      </p>

      <Widget className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[12px] text-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-normal">Card</th>
              <th scope="col" className="hidden px-3 py-3 font-normal sm:table-cell">Issuer</th>
              <th scope="col" className="px-3 py-3 font-normal">Last checked</th>
              <th scope="col" className="py-3 pr-5 pl-3 text-right font-normal">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ card, daysSince, stale, source }) => (
              <tr key={card.id} className="align-top">
                <th scope="row" className="px-5 py-3 font-normal">
                  <span className="block">{card.name}</span>
                  <span className="block text-[12px] text-muted sm:hidden">{card.issuer}</span>
                </th>
                <td className="hidden px-3 py-3 text-muted sm:table-cell">{card.issuer}</td>
                <td className="px-3 py-3">
                  <span className="block tabular-nums">{longDate(card.lastVerified)}</span>
                  <span className={cn("block text-[12px]", stale ? "font-medium text-ink" : "text-muted")}>
                    {stale ? `Due, ${daysSince} days ago` : daysSince === 0 ? "Today" : `${daysSince} days ago`}
                  </span>
                </td>
                <td className="py-3 pr-5 pl-3 text-right">
                  <a
                    href={source ?? card.issuerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-control text-[13px] text-ink underline decoration-line underline-offset-4 transition-[text-decoration-color] duration-[var(--cd-dur-hover)] ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {source ? "Terms" : "Card page"}
                    <ArrowSquareOutIcon size={13} aria-hidden />
                    <span className="sr-only">for {card.name}, opens in a new tab</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Widget>

      <p className="max-w-[64ch] text-[13px] leading-relaxed text-muted">
        To update a card, change it in <code className="text-ink">data/cards.seed.ts</code> with
        the terms page open, set its <code className="text-ink">lastVerified</code> date, and give
        any credit whose amount or period changed a new id.
      </p>
    </div>
  );
}
