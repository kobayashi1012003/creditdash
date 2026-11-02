"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { getCardsById } from "@/lib/catalog";
import { awardVsCash, pointsForSpend } from "@/lib/calculators/engine";
import { DEFAULT_VALUATION_MAP } from "@/lib/valuations";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The three calculators taking turns, each with one worked example. The
 * figures come from the same engine as the app at CreditDash's default
 * valuations; only the inputs are made up, and the page says so. Steps by
 * itself until someone picks a tab, pauses off screen, and sits still under
 * reduced motion.
 */

const SCENE_MS = 4200;
const COUNT_MS = 700;

const gold = getCardsById(["amex-gold"])[0];
const MR = DEFAULT_VALUATION_MAP["amex-mr"] ?? 2;

// Is this card worth it? Credits used plus points from a year of spend.
const DINING_YEAR = 12_000;
const GROCERY_YEAR = 6_000;
const CREDITS_USED = 240;
const goldPoints = gold
  ? pointsForSpend(gold, "dining", DINING_YEAR) + pointsForSpend(gold, "groceries", GROCERY_YEAR)
  : 0;
const goldValue = CREDITS_USED + (goldPoints * MR) / 100;
const goldFee = gold?.annualFee ?? 325;

// Points or cash? A flight.
const FLIGHT = { cash: 720, points: 30_000, fees: 6 };
const award = awardVsCash({
  cashPrice: FLIGHT.cash,
  points: FLIGHT.points,
  fees: FLIGHT.fees,
  rewardsForgone: 0,
  valuation: MR,
});
const awardCpp = award.kind === "result" ? award.centsPerPoint : 0;

// What is my spend worth?
const MONTHLY_DINING = 600;
const spendPoints = gold ? pointsForSpend(gold, "dining", MONTHLY_DINING * 12) : 0;

const SCENES = [
  { id: "worth", label: "Is this card worth it?" },
  { id: "award", label: "Points or cash?" },
  { id: "spend", label: "What is my spend worth?" },
] as const;

export function CalculatorDemo() {
  const reduceMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [touring, setTouring] = useState(true);
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0);
  const ref = useRef<HTMLDivElement>(null);

  // Steps through the scenes while visible.
  useEffect(() => {
    if (!touring || reduceMotion) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    const id = window.setInterval(() => {
      if (visible && !document.hidden) setScene((s) => (s + 1) % SCENES.length);
    }, SCENE_MS);
    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [touring, reduceMotion]);

  // Counts each scene's numbers up from zero, eased out. Timers rather than
  // animation frames, so the count still lands where frames are paused.
  useEffect(() => {
    if (reduceMotion) return;
    let timer = 0;
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / COUNT_MS);
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) timer = window.setTimeout(tick, 16);
    };
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, [scene, reduceMotion]);

  const p = reduceMotion ? 1 : progress;
  const current = SCENES[scene];

  return (
    <div ref={ref}>
      <div role="tablist" aria-label="Calculator" className="flex flex-wrap gap-1.5">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={i === scene}
            onClick={() => {
              setTouring(false);
              setScene(i);
            }}
            className={cn(
              "rounded-control border px-3 py-1.5 text-[13px] font-medium",
              "transition-[background-color,border-color,color,transform] duration-[var(--cd-dur-press)] ease-out active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              i === scene
                ? "border-transparent bg-ink text-bg"
                : "border-line bg-surface text-muted hover:border-muted hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={current.label} className="mt-6 min-h-[210px] rounded-inner border border-line bg-surface p-5 sm:p-6">
        {current.id === "worth" && (
          <div>
            <p className="text-[13px] text-muted">
              {gold?.name ?? "Amex Gold"}, {usd(goldFee)} fee
            </p>
            <p className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em] tabular-nums">
              {usd(goldValue * p)}
              <span className="ml-2 text-[15px] font-normal tracking-normal text-muted">back this year</span>
            </p>
            <div className="relative mt-6 h-3 overflow-hidden rounded-pill bg-panel">
              <span
                className="absolute inset-y-0 left-0 w-full origin-left rounded-pill bg-mint-ink"
                style={{ transform: `scaleX(${p})` }}
              />
              <span
                aria-hidden
                className="absolute inset-y-0 w-0.5 bg-ink"
                style={{ left: `${(goldFee / goldValue) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] text-muted">
              Fee line at {usd(goldFee)}.{" "}
              <span className={cn("font-medium text-ink transition-opacity duration-[var(--cd-dur-hover)]", p < 1 && "opacity-0")}>
                Worth keeping, {usd(goldValue - goldFee)} ahead.
              </span>
            </p>
          </div>
        )}

        {current.id === "award" && (
          <div>
            <p className="text-[13px] text-muted">
              A {usd(FLIGHT.cash)} flight, or {FLIGHT.points.toLocaleString("en-US")} points and{" "}
              {usd(FLIGHT.fees)} in fees
            </p>
            <p className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em] tabular-nums">
              {(awardCpp * p).toFixed(1)}¢
              <span className="ml-2 text-[15px] font-normal tracking-normal text-muted">a point</span>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-inner border border-line px-3 py-2.5">
                <p className="text-muted">Your valuation</p>
                <p className="mt-0.5 font-medium tabular-nums">{MR.toFixed(1)}¢</p>
              </div>
              <div className="rounded-inner border border-line px-3 py-2.5">
                <p className="text-muted">This booking</p>
                <p className="mt-0.5 font-medium tabular-nums">{(awardCpp * p).toFixed(1)}¢</p>
              </div>
            </div>
            <p className={cn("mt-3 text-[13px] font-medium transition-opacity duration-[var(--cd-dur-hover)]", p < 1 && "opacity-0")}>
              {award.kind === "result" && award.verdict === "use-points"
                ? "Use points. They go further here."
                : award.kind === "result" && award.verdict === "close-call"
                  ? "A close call."
                  : "Pay cash."}
            </p>
          </div>
        )}

        {current.id === "spend" && (
          <div>
            <p className="text-[13px] text-muted">
              {usd(MONTHLY_DINING)} a month on dining, {gold?.name ?? "Amex Gold"}
            </p>
            <p className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em] tabular-nums">
              {Math.round(spendPoints * p).toLocaleString("en-US")}
              <span className="ml-2 text-[15px] font-normal tracking-normal text-muted">points a year</span>
            </p>
            <div className="mt-6 flex items-end gap-1.5" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  className="h-10 flex-1 origin-bottom rounded-control bg-peach-ink"
                  style={{ transform: `scaleY(${Math.max(0, Math.min(1, p * 12 - i))})` }}
                />
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">
              At 4x, worth about{" "}
              <span className="font-medium text-ink">{usd((spendPoints * MR * p) / 100)}</span> at{" "}
              {MR.toFixed(1)}¢ a point.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
