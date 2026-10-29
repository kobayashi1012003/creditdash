"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowSquareOutIcon, SparkleIcon } from "@phosphor-icons/react";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY, type Plan } from "@/lib/plan";
import { cn } from "@/lib/cn";
import {
  ACCOUNTS_ENABLED,
  openBillingPortal,
  refreshAccount,
  startCheckout,
  waitForPremium,
  useWalletIncludingHidden,
  type Account,
} from "@/lib/data";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, ConfirmDialogClose } from "@/components/ui/confirm-dialog";

/** Where Stripe sent the browser back from, read from the address. */
function readReturn(): "checkout" | "portal" | null {
  const v = new URLSearchParams(window.location.search).get("billing");
  return v === "done" ? "checkout" : v === "back" ? "portal" : null;
}

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * Free and Premium side by side, and the way between them. Stripe hosts
 * both directions: Checkout to subscribe, the Customer Portal to cancel or
 * change the card. Premium itself only ever arrives by webhook, so this
 * screen asks the account again after coming back rather than assuming.
 */
export function PlanSection({
  plan,
  account,
}: {
  plan: Plan;
  account: Account | null;
}) {
  const [confirming, setConfirming] = useState<"idle" | "waiting" | "done" | "slow">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const saved = useWalletIncludingHidden().length;

  const userId = account?.userId;
  useEffect(() => {
    const returning = readReturn();
    if (!returning || !userId) return;
    // Clean the address so a reload does not repeat this.
    const url = new URL(window.location.href);
    url.searchParams.delete("billing");
    window.history.replaceState(null, "", url);

    let live = true;
    if (returning === "checkout") {
      void Promise.resolve()
        .then(() => live && setConfirming("waiting"))
        .then(() => waitForPremium())
        .then((ok) => live && setConfirming(ok ? "done" : "slow"));
    } else {
      // The portal's change can land a moment after the browser does.
      void refreshAccount()
        .then(() => new Promise((r) => setTimeout(r, 3000)))
        .then(() => {
          if (live) void refreshAccount();
        });
    }
    return () => {
      live = false;
    };
  }, [userId]);

  async function go(to: "checkout" | "portal") {
    setWarn(false);
    setBusy(true);
    setError(null);
    const problem = await (to === "checkout" ? startCheckout() : openBillingPortal());
    // Only reached if the browser did not leave for Stripe.
    setBusy(false);
    setError(problem);
  }

  const billing = account?.billing ?? null;
  // Gifted and not also paying: there is no live subscription to manage.
  // An ended one (they paid once, then cancelled) does not count.
  const paying = billing !== null && ["active", "trialing", "past_due"].includes(billing.status);
  const giftOnly = plan === "premium" && account?.gifted === true && !paying;
  // A gift outlasts any cancelled subscription, so nothing is ending and
  // cancelling hides no cards.
  const gifted = account?.gifted === true;
  const ending = plan === "premium" && !gifted && billing?.cancelAtPeriodEnd;
  const hiddenIfFree = gifted ? 0 : Math.max(0, saved - FREE_CARD_LIMIT);

  function manage() {
    // Warn before the portal, where cancelling happens, if cancelling would
    // hide cards. Not when Premium is already ending: they have been told.
    if (hiddenIfFree > 0 && !ending) setWarn(true);
    else void go("portal");
  }

  let premiumAction: React.ReactNode = null;
  if (plan === "free") {
    premiumAction = account ? (
      <Button className="mt-4 w-full" onClick={() => go("checkout")} disabled={busy}>
        <SparkleIcon size={16} weight="fill" />
        {busy ? "Opening Stripe" : `Upgrade for $${PREMIUM_PRICE_MONTHLY} a month`}
      </Button>
    ) : ACCOUNTS_ENABLED ? (
      <Button className="mt-4 w-full" nativeButton={false} render={<Link href="/signin" />}>
        Sign in to upgrade
      </Button>
    ) : null;
  } else if (giftOnly) {
    premiumAction = (
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        Premium was given to this account, so there is nothing to pay and
        nothing to cancel.
      </p>
    );
  } else if (account) {
    premiumAction = (
      <Button variant="outline" className="mt-4 w-full" onClick={manage} disabled={busy}>
        <ArrowSquareOutIcon size={16} />
        {busy ? "Opening Stripe" : "Manage billing"}
      </Button>
    );
  }

  return (
    <Widget title="Plan" id="plan" className="scroll-mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="No cost"
          current={plan === "free"}
          points={[
            `Up to ${FREE_CARD_LIMIT} saved cards`,
            "Tracker, calculators and compare",
            "No ads, ever",
          ]}
        />
        <PlanCard
          name="Premium"
          price={`$${PREMIUM_PRICE_MONTHLY} a month`}
          current={plan === "premium"}
          status={
            giftOnly
              ? "On the house"
              : plan === "premium" && billing?.periodEnd
              ? ending
                ? `Ends ${longDate(billing.periodEnd)}`
                : `Renews ${longDate(billing.periodEnd)}`
              : undefined
          }
          points={[
            "As many cards as you own",
            "Everything in Free",
            "Cancel whenever you like",
          ]}
          action={premiumAction}
        />
      </div>

      <div aria-live="polite" className="mt-4 max-w-[60ch] text-[13px] leading-relaxed">
        {confirming === "waiting" && plan !== "premium" && (
          <p className="text-muted">Confirming your payment with Stripe.</p>
        )}
        {confirming === "done" && (
          <p className="text-[var(--cd-mint-ink)]">Premium is on. Every card you save now shows.</p>
        )}
        {confirming === "slow" && (
          <p className="text-muted">
            Stripe has not confirmed the payment yet. It usually takes a few
            seconds; reload this page in a minute. You will not be charged twice.
          </p>
        )}
        {ending && hiddenIfFree > 0 && (
          <p className="text-muted">
            When Premium ends, only your first {FREE_CARD_LIMIT} cards will
            show.{" "}
            {hiddenIfFree === 1
              ? "The other one stays saved and comes back if you return to Premium."
              : `The other ${hiddenIfFree} stay saved and come back if you return to Premium.`}
          </p>
        )}
        {billing?.status === "past_due" && (
          <p className="text-[var(--cd-peach-ink)]">
            Your last payment did not go through. Stripe will try again; update
            your card in Manage billing to keep Premium.
          </p>
        )}
        {error && (
          <p role="alert" className="text-[var(--cd-peach-ink)]">
            {error}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={warn}
        onOpenChange={setWarn}
        title={`${hiddenIfFree} ${hiddenIfFree === 1 ? "card" : "cards"} will be hidden if you cancel`}
        actions={
          <>
            <ConfirmDialogClose render={<Button variant="ghost" />}>Stay here</ConfirmDialogClose>
            <Button onClick={() => go("portal")}>
              <ArrowSquareOutIcon size={16} />
              Continue to billing
            </Button>
          </>
        }
      >
        <p>
          You have {saved} cards saved. Free shows {FREE_CARD_LIMIT}, so if you
          cancel, only your first {FREE_CARD_LIMIT} will show once Premium ends.
        </p>
        <p>
          Nothing is deleted.{" "}
          {hiddenIfFree === 1
            ? "The other one keeps its credits and history, and comes back if you return to Premium."
            : `The other ${hiddenIfFree} keep their credits and history, and come back if you return to Premium.`}{" "}
          To choose which {FREE_CARD_LIMIT} stay, put them first in your Wallet
          before you go.
        </p>
      </ConfirmDialog>
    </Widget>
  );
}

function PlanCard({
  name,
  price,
  points,
  current,
  status,
  action,
}: {
  name: string;
  price: string;
  points: string[];
  current?: boolean;
  status?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-inner border p-5",
        current ? "border-ink" : "border-line",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl leading-none">{name}</h3>
        {current && <span className="text-[13px] text-muted">{status ?? "Current"}</span>}
      </div>
      <p className="mt-2 text-sm text-muted">{price}</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {points.map((p) => (
          <li key={p} className="text-muted">
            {p}
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}
