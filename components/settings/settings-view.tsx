"use client";

import { useState } from "react";
import {
  DownloadSimpleIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Program } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { DEFAULT_VALUATIONS } from "@/data/cards.seed";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY, type Plan } from "@/lib/plan";
import { pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  deleteEverything,
  setPlan,
  setPointBalance,
  setValuation,
  useIsLoading,
  usePlan,
  usePointBalances,
  useValuations,
  useWallet,
  walletToCsv,
} from "@/lib/data";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export function SettingsView() {
  const plan = usePlan();
  const valuations = useValuations();
  const balances = usePointBalances();
  const entries = useWallet();
  const isLoading = useIsLoading();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function exportCsv() {
    const blob = new Blob([walletToCsv(entries)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creditdash-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div aria-busy aria-live="polite" className="space-y-5">
        <span className="sr-only">Loading your settings</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[180px] rounded-widget border border-line bg-surface"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Widget title="Appearance">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
            System follows whatever your device is set to, and changes with it
            through the day.
          </p>
          <ThemeToggle />
        </div>
      </Widget>

      <Widget title="Points you hold" id="balances" className="scroll-mt-6">
        <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-muted">
          Entered by hand, because nothing here is linked to an account.
        </p>
        <ul className="divide-y divide-line">
          {DEFAULT_VALUATIONS.map(({ program }) => {
            const balance =
              balances.find((b) => b.program === program)?.balance ?? 0;
            return (
              <li
                key={program}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <Label htmlFor={`bal-${program}`} className="text-sm">
                  {PROGRAM_LABELS[program]}
                </Label>
                <Input
                  id={`bal-${program}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1000"
                  value={balance}
                  onChange={(e) =>
                    setPointBalance(
                      program as Program,
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                  className="h-9 w-32 shrink-0 rounded-inner text-right tabular-nums"
                />
              </li>
            );
          })}
        </ul>
      </Widget>

      <Widget
        title="What a point is worth"
        action={<p className="text-[13px] text-muted">Cents per point</p>}
        id="valuations"
        className="scroll-mt-6"
      >
        <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-muted">
          These drive every dollar figure in the Tracker and the calculators.
          The defaults are a reasonable middle; set them to what you actually
          get.
        </p>
        <ul className="divide-y divide-line">
          {DEFAULT_VALUATIONS.map(({ program }) => {
            const cpp = valuations[program] ?? 1;
            const balance = balances.find((b) => b.program === program);
            return (
              <li
                key={program}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Label htmlFor={`cpp-${program}`} className="text-sm">
                    {PROGRAM_LABELS[program]}
                  </Label>
                  {balance && balance.balance > 0 && (
                    <p className="text-[13px] tabular-nums text-muted">
                      {pts(balance.balance)} points,{" "}
                      {usd(pointsValue(balance.balance, cpp))}
                    </p>
                  )}
                </div>
                <Input
                  id={`cpp-${program}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={cpp}
                  onChange={(e) =>
                    setValuation(
                      program as Program,
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                  className="h-9 w-20 shrink-0 rounded-inner text-right tabular-nums"
                />
              </li>
            );
          })}
        </ul>
      </Widget>

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
            points={[
              "As many cards as you own",
              "Everything in Free",
              "Cancel whenever you like",
            ]}
            action={
              plan === "free" ? (
                <Button className="mt-4 w-full" disabled>
                  <SparkleIcon size={16} weight="fill" />
                  Payments coming soon
                </Button>
              ) : null
            }
          />
        </div>
      </Widget>

      <Widget title="Your data">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={entries.length === 0}
          >
            <DownloadSimpleIcon size={16} />
            Export as CSV
          </Button>
          {confirmingDelete ? (
            <>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteEverything();
                  setConfirmingDelete(false);
                }}
              >
                <TrashIcon size={16} />
                Yes, delete it all
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <TrashIcon size={16} />
              Delete everything
            </Button>
          )}
        </div>
        <p className="mt-4 max-w-[58ch] text-[13px] leading-relaxed text-muted">
          {confirmingDelete
            ? "This removes every card, credit and balance from this browser. It cannot be undone."
            : "Your wallet lives in this browser and nowhere else. Clearing site data removes it, and so does the button above."}
        </p>
      </Widget>

      {/* Development only. Lets the free card limit be exercised without a
          payment flow existing yet. */}
      <Widget
        title="Development"
        action={<span className="text-[13px] text-muted">Not shipped</span>}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm">Pretend this account is</p>
            <p className="max-w-[44ch] text-[13px] leading-relaxed text-muted">
              Switches the demo user between plans so the {FREE_CARD_LIMIT}
              -card limit can be tested. Cards over the limit are kept, not
              deleted.
            </p>
          </div>
          <div className="flex gap-2">
            {(["free", "premium"] as const).map((p) => (
              <Button
                key={p}
                variant={plan === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPlan(p as Plan)}
                aria-pressed={plan === p}
              >
                {p === "free" ? "Free" : "Premium"}
              </Button>
            ))}
          </div>
        </div>
      </Widget>
    </div>
  );
}

function PlanCard({
  name,
  price,
  points,
  current,
  action,
}: {
  name: string;
  price: string;
  points: string[];
  current?: boolean;
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
        {current && <span className="text-[13px] text-muted">Current</span>}
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
