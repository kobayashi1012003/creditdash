"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CursorIcon } from "@phosphor-icons/react";
import { getCardsById } from "@/lib/catalog";
import { money, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CardFace } from "@/components/ui/card-face";
import { CheckmarkRow } from "@/components/ui/checkmark-row";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Widget } from "@/components/ui/widget";

/**
 * The Tracker page at work, for the Features page. A pointer presses a
 * month and slides along the row, ticking several at once, and "Credits
 * this year" keeps up as it goes. Built from the app's own pieces (Widget,
 * ProgressRing, CheckmarkRow, CardFace) with sample credits. Anyone can
 * take over: pressing or sliding across the slots stops the tour.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The demo's today: November. */
const NOW = 10;

type Row = {
  name: string;
  amount: number;
  period: "monthly" | "semiannual";
  tint: string;
};

const ROWS: Row[] = [
  { name: "Dining credit", amount: 10, period: "monthly", tint: "var(--cd-cat-dining-ink)" },
  { name: "Uber Cash", amount: 10, period: "monthly", tint: "var(--cd-cat-transit-ink)" },
  { name: "Resy credit", amount: 50, period: "semiannual", tint: "var(--cd-cat-dining-ink)" },
];

const start = (): number[][] => [
  Array.from({ length: 12 }, (_, i) => (i < 4 ? 10 : 0)),
  Array.from({ length: 12 }, (_, i) => (i < 2 ? 10 : i === 2 ? 6 : 0)),
  [50, 0],
];

/** Each stroke: row, first slot, last slot. Pressed at the first, slid to the last. */
const STROKES: [number, number, number][] = [
  [0, 4, NOW],
  [1, 3, NOW],
  [2, 1, 1],
];

const MOVE_MS = 560;
const PRESS_MS = 220;
const STEP_MS = 170;
const REST_MS = 650;
const HOLD_MS = 2600;

const available = ROWS.reduce((sum, r) => sum + r.amount * (r.period === "monthly" ? 12 : 2), 0);

export function TrackerDemo() {
  const reduceMotion = useReducedMotion();
  const [used, setUsed] = useState(start);
  const [touring, setTouring] = useState(true);
  const [pointer, setPointer] = useState<{ x: number; y: number; pressed: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [gold, csr] = getCardsById(["amex-gold", "csr"]);

  const total = used.reduce((sum, row, r) => sum + row.reduce((a, v) => a + Math.min(v, ROWS[r].amount), 0), 0);

  const slotCentre = useCallback((row: number, slot: number) => {
    const panel = panelRef.current;
    const el = panel?.querySelector(`[data-row="${row}"] [data-slot="${slot}"]`);
    if (!panel || !el) return null;
    const p = panel.getBoundingClientRect();
    const s = el.getBoundingClientRect();
    return { x: s.left - p.left + s.width * 0.55, y: s.top - p.top + s.height * 0.55 };
  }, []);

  useEffect(() => {
    if (!touring || reduceMotion) return;
    let cancelled = false;
    let timer = 0;
    let visible = false;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timer = window.setTimeout(r, ms);
      });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.35 });
    if (panelRef.current) io.observe(panelRef.current);

    const fill = (row: number, slot: number) =>
      setUsed((u) => u.map((r, i) => (i === row ? r.map((v, s) => (s === slot ? ROWS[row].amount : v)) : r)));

    (async () => {
      while (!cancelled) {
        while (!cancelled && (!visible || document.hidden)) await wait(300);
        for (const [row, from, to] of STROKES) {
          if (cancelled) return;
          const at = slotCentre(row, from);
          if (at) setPointer({ ...at, pressed: false });
          await wait(MOVE_MS);
          if (cancelled) return;
          // Press and hold, then slide along the row.
          setPointer((p) => (p ? { ...p, pressed: true } : p));
          fill(row, from);
          await wait(PRESS_MS);
          for (let s = from + 1; s <= to && !cancelled; s++) {
            const next = slotCentre(row, s);
            if (next) setPointer({ ...next, pressed: true });
            await wait(STEP_MS);
            fill(row, s);
          }
          setPointer((p) => (p ? { ...p, pressed: false } : p));
          await wait(REST_MS);
        }
        await wait(HOLD_MS);
        if (cancelled) return;
        setPointer(null);
        setUsed(start());
        await wait(900);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [touring, reduceMotion, slotCentre]);

  const toggle = (row: number, slot: number) => {
    setTouring(false);
    setPointer(null);
    setUsed((u) =>
      u.map((r, i) =>
        i === row ? r.map((v, s) => (s === slot ? (v >= ROWS[row].amount ? 0 : ROWS[row].amount) : v)) : r,
      ),
    );
  };

  return (
    <div ref={panelRef} className="@container relative">
      {/* The card switcher, as on the Tracker. */}
      <div className="flex gap-2 overflow-hidden" aria-hidden>
        {[gold, csr].filter(Boolean).map((card, i) => (
          <span
            key={card.id}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-inner border py-1.5 pr-3.5 pl-1.5",
              i === 0 ? "border-ink bg-surface" : "border-line",
            )}
          >
            <span className="w-11 shrink-0">
              <CardFace card={card} sizes="44px" />
            </span>
            <span className={cn("text-[13px]", i === 0 ? "font-medium" : "text-muted")}>{card.name}</span>
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-4 @lg:grid-cols-2">
        <Widget title="Credits this year">
          <div className="flex items-center gap-4" aria-live="off">
            <ProgressRing value={total / available} size={76} thickness={8} label={`${Math.round((total / available) * 100)}%`} />
            <div className="min-w-0">
              <p className="text-2xl leading-none tabular-nums">{money(total)}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-muted">used of {usd(available)} this card offers</p>
            </div>
          </div>
        </Widget>
        <Widget title="Resetting soon" className="@max-lg:hidden">
          <ul className="space-y-2.5 text-[13px]">
            {ROWS.filter((r) => r.period === "monthly").map((r, i) => (
              <li key={r.name} className="flex items-baseline justify-between gap-3">
                <span>
                  {r.name}
                  <span className="block text-[12px] text-muted">
                    {used[i][NOW] >= r.amount ? "Used this month" : "29 days left"}
                  </span>
                </span>
                <span className="tabular-nums">{usd(r.amount)}</span>
              </li>
            ))}
          </ul>
        </Widget>
      </div>

      <Widget className="mt-4" title="Amex Gold credits">
        <ul className="space-y-5">
          {ROWS.map((r, row) => (
            <li key={r.name} data-row={row}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted tabular-nums">
                  {money(used[row].reduce((a, v) => a + v, 0))} of {usd(r.amount * used[row].length)}
                </span>
              </div>
              <CheckmarkRow
                period={r.period}
                used={used[row]}
                amount={r.amount}
                tint={r.tint}
                currentIndex={r.period === "monthly" ? NOW : 1}
                slotLabel={(i) => `${r.name}, ${r.period === "monthly" ? MONTHS[i] : i === 0 ? "Jan to Jun" : "Jul to Dec"}`}
                caption={(i) => (r.period === "monthly" ? MONTHS[i] : i === 0 ? "Jan to Jun" : "Jul to Dec")}
                onToggle={(s) => toggle(row, s)}
                className={
                  r.period === "monthly"
                    ? "grid grid-cols-[repeat(6,minmax(0,2.5rem))] gap-x-1.5 gap-y-3 @xl:grid-cols-[repeat(12,minmax(0,2.5rem))]"
                    : "grid max-w-xs grid-cols-2 gap-3"
                }
              />
            </li>
          ))}
        </ul>
      </Widget>

      {/* The pointer is decoration; the slots carry the state. */}
      {pointer && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 text-ink drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)] transition-transform ease-[var(--cd-ease-in-out)]"
          style={{
            transform: `translate(${pointer.x}px, ${pointer.y}px) scale(${pointer.pressed ? 0.84 : 1})`,
            transitionDuration: `${pointer.pressed ? STEP_MS : MOVE_MS}ms`,
          }}
        >
          <CursorIcon size={22} weight="fill" />
        </span>
      )}
    </div>
  );
}
