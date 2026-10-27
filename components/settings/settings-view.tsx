"use client";

import { useState } from "react";
import { DownloadSimpleIcon, SparkleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import type { PointBalance, Program } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { DEFAULT_VALUATIONS } from "@/data/cards.seed";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY, type Plan } from "@/lib/plan";
import { pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export function SettingsView({ balances }: { balances: PointBalance[] }) {
  const [plan, setPlan] = useState<Plan>("premium");
  const [valuations, setValuations] = useState(() =>
    Object.fromEntries(
      DEFAULT_VALUATIONS.map((v) => [v.program, v.centsPerPoint]),
    ) as Record<Program, number>,
  );
  const { theme } = useTheme();

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
            const balance = balances.find((b) => b.program === program);
            const cpp = valuations[program];
            return (
              <li
                key={program}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Label htmlFor={`cpp-${program}`} className="text-sm">
                    {PROGRAM_LABELS[program]}
                  </Label>
                  {balance && (
                    <p className="text-[13px] text-muted tabular-nums">
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
                    setValuations((v) => ({
                      ...v,
                      [program]: Math.max(0, Number(e.target.value) || 0),
                    }))
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
          <Button variant="outline">
            <DownloadSimpleIcon size={16} />
            Export as CSV
          </Button>
          <Button variant="destructive">
            <TrashIcon size={16} />
            Delete everything
          </Button>
        </div>
        <p className="mt-4 max-w-[58ch] text-[13px] leading-relaxed text-muted">
          Your wallet lives in this browser and nowhere else. Clearing site
          data removes it, and so does the button above.
        </p>
      </Widget>

      {/* Development only. Phase 2 uses this to exercise the free card limit
          without building a payment flow first. */}
      <Widget
        title="Development"
        action={<span className="text-[13px] text-muted">Not shipped</span>}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm">Pretend this account is</p>
            <p className="text-[13px] text-muted">
              Switches the demo user between plans to test the card limit.
            </p>
          </div>
          <div className="flex gap-2">
            {(["free", "premium"] as const).map((p) => (
              <Button
                key={p}
                variant={plan === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPlan(p)}
                aria-pressed={plan === p}
              >
                {p === "free" ? "Free" : "Premium"}
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          Theme is currently set to {theme ?? "system"}.
        </p>
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
