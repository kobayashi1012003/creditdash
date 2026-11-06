"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { CursorIcon } from "@phosphor-icons/react";
import { CheckmarkRow } from "@/components/ui/checkmark-row";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The Tracker at work: a pointer ticks off this year's three monthly
 * credits one by one and the running total keeps up. Clicking any slot takes over and
 * stops the tour. Sample data, labelled as such on the page.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
/** The demo's "today" is October, the month the page was written in. */
const NOW = 9;
/** The Amex Gold's three monthly credits. */
const ROWS = [
  { name: "Dining credit", amount: 10, tint: "var(--cd-cat-dining-ink)" },
  { name: "Uber Cash", amount: 10, tint: "var(--cd-cat-transit-ink)" },
  { name: "Dunkin' credit", amount: 7, tint: "var(--cd-cat-dining-ink)" },
] as const;

const start = (): number[][] =>
  [6, 5, 7].map((through, row) =>
    Array.from({ length: 12 }, (_, i) => (i < through ? ROWS[row].amount : 0)),
  );

/** The slots the pointer visits, in order: row, month. */
const STEPS: [number, number][] = [
  [0, 6], [1, 5], [1, 6], [0, 7], [2, 7], [1, 7], [0, 8], [2, 8], [1, 8], [0, 9], [2, 9], [1, 9],
];

const MOVE_MS = 520;
const PRESS_MS = 160;
const REST_MS = 420;
const HOLD_MS = 2600;

export function CreditDemo() {
  const reduceMotion = useReducedMotion();
  const [used, setUsed] = useState(start);
  const [touring, setTouring] = useState(true);
  const [pointer, setPointer] = useState<{ x: number; y: number; pressed: boolean } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const total = used.flat().reduce((a, b) => a + b, 0);
  const available = ROWS.reduce((sum, r) => sum + r.amount * (NOW + 1), 0);

  const slotCentre = useCallback((row: number, month: number) => {
    const panel = panelRef.current;
    const slot = panel?.querySelector(`[data-row="${row}"] [data-slot="${month}"]`);
    if (!panel || !slot) return null;
    const p = panel.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    return { x: s.left - p.left + s.width * 0.55, y: s.top - p.top + s.height * 0.55 };
  }, []);

  useEffect(() => {
    if (!touring || reduceMotion) return;
    let cancelled = false;
    let timer = 0;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timer = window.setTimeout(r, ms);
      });

    const panel = panelRef.current;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.4 });
    if (panel) io.observe(panel);

    (async () => {
      while (!cancelled) {
        while (!cancelled && (!visible || document.hidden)) await wait(300);
        for (const [row, month] of STEPS) {
          if (cancelled) return;
          const at = slotCentre(row, month);
          if (at) setPointer({ ...at, pressed: false });
          await wait(MOVE_MS);
          if (cancelled) return;
          setPointer((p) => (p ? { ...p, pressed: true } : p));
          setUsed((u) => u.map((r, i) => (i === row ? r.map((v, m) => (m === month ? ROWS[row].amount : v)) : r)));
          await wait(PRESS_MS);
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

  const toggle = (row: number, month: number) => {
    setTouring(false);
    setPointer(null);
    setUsed((u) =>
      u.map((r, i) =>
        i === row
          ? r.map((v, m) => (m === month ? (v >= ROWS[row].amount ? 0 : ROWS[row].amount) : v))
          : r,
      ),
    );
  };

  return (
    <div ref={panelRef} className="relative">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-lavender-ink/80">Amex Gold, this year</p>
          <p className="mt-1 text-[40px] leading-none font-medium tracking-[-0.03em] text-lavender-ink">
            {usd(total)}
            <span className="ml-2 text-[15px] font-normal tracking-normal text-lavender-ink/80">
              of {usd(available)} used so far
            </span>
          </p>
        </div>
        <p className="hidden text-right font-mono text-[11px] leading-snug text-lavender-ink/80 sm:block">
          Resets monthly
          <br />
          Next on the 1st
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {ROWS.map((r, row) => (
          <div key={r.name} data-row={row}>
            <div className="mb-2 flex items-baseline justify-between text-[13px]">
              <span className="font-medium text-ink">{r.name}</span>
              <span className="text-muted">{usd(r.amount)} a month</span>
            </div>
            <CheckmarkRow
              period="monthly"
              used={used[row]}
              amount={r.amount}
              tint={r.tint}
              currentIndex={NOW}
              slotLabel={(i) => `${r.name}, ${MONTHS[i]}`}
              caption={(i) => MONTHS[i].slice(0, 3)}
              onToggle={(m) => toggle(row, m)}
              fluid
              className="grid grid-cols-6 gap-x-1.5 gap-y-2.5 sm:grid-cols-12 sm:gap-x-1"
            />
          </div>
        ))}
      </div>

      {/* The pointer is decoration; the slots themselves carry the state. */}
      {pointer && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 text-ink drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)] transition-transform ease-[var(--cd-ease-in-out)]"
          style={{
            transform: `translate(${pointer.x}px, ${pointer.y}px) scale(${pointer.pressed ? 0.82 : 1})`,
            transitionDuration: `${pointer.pressed ? PRESS_MS / 2 : MOVE_MS}ms`,
          }}
        >
          <CursorIcon size={22} weight="fill" className={cn("text-ink")} />
        </span>
      )}
    </div>
  );
}
