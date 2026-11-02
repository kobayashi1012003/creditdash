"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  CheckIcon,
  ListBulletsIcon,
  ListChecksIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * How credits get tracked without the app: a notes doc, half checklist and
 * half worry, with someone typing a question at the bottom, deleting it,
 * and typing another. One box keeps being ticked and unticked, because
 * nobody is sure. Sample text, labelled as such on the page.
 */

type Line =
  | { kind: "heading"; text: string }
  | { kind: "check"; text: string; done: boolean; strike?: boolean; mark?: boolean; indent?: boolean }
  | { kind: "bullet"; text: string; indent?: boolean };

const LINES: Line[] = [
  { kind: "heading", text: "AMEX GOLD" },
  { kind: "check", text: "dining $10 jan", done: true },
  { kind: "check", text: "dining feb (grubhub??)", done: true },
  { kind: "check", text: "dining march", done: false },
  { kind: "check", text: "uber cash, expires end of month?", done: false, mark: true },
  { kind: "bullet", text: "resy $50 by june i think. or july", indent: true },
  { kind: "heading", text: "sapphire" },
  { kind: "check", text: "travel credit $300", done: true, strike: true },
  { kind: "check", text: "the edit thing, 2 nights min", done: false, indent: true },
  { kind: "bullet", text: "doordash every month?? never used it" },
];

/** The box that keeps changing its mind. */
const WAVERING = 3;

const PHRASES = [
  "did i use the uber one in sept or oct",
  "check statement for the dining credit",
  "wait does resy reset in july",
];

const TYPE_MS = 55;
const DELETE_MS = 22;
const HOLD_MS = 1400;

export function MessyNotes() {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(reduceMotion ? PHRASES[0] : "");
  const [wavering, setWavering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    let timer = 0;
    let visible = false;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timer = window.setTimeout(r, ms);
      });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);

    (async () => {
      for (let p = 0; !cancelled; p = (p + 1) % PHRASES.length) {
        while (!cancelled && (!visible || document.hidden)) await wait(300);
        const phrase = PHRASES[p];
        for (let i = 1; i <= phrase.length && !cancelled; i++) {
          setTyped(phrase.slice(0, i));
          await wait(TYPE_MS + (phrase[i - 1] === " " ? 40 : 0));
        }
        await wait(HOLD_MS);
        if (cancelled) return;
        setWavering((w) => !w);
        await wait(500);
        for (let i = phrase.length - 1; i >= 0 && !cancelled; i--) {
          setTyped(phrase.slice(0, i));
          await wait(DELETE_MS);
        }
        await wait(500);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div ref={ref} aria-label="A notes document of credit card benefits, kept by hand" role="img">
      <div aria-hidden>
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[14px] font-medium">card perks (copy) (2)</p>
          <p className="shrink-0 text-[11px] text-muted">Last edit 3 weeks ago</p>
        </div>
        <div className="mt-2.5 flex items-center gap-3 border-b border-line pb-2.5 text-muted">
          <TextBIcon size={14} />
          <TextItalicIcon size={14} />
          <TextUnderlineIcon size={14} />
          <span className="h-3.5 w-px bg-line" />
          <ListBulletsIcon size={14} />
          <ListChecksIcon size={14} />
        </div>

        <ul className="mt-3 space-y-1.5 text-[13px] leading-snug">
          {LINES.map((line, i) => {
            if (line.kind === "heading") {
              return (
                <li key={i} className={cn("font-medium", i > 0 && "pt-2")}>
                  {line.text}
                </li>
              );
            }
            if (line.kind === "bullet") {
              return (
                <li key={i} className={cn("flex gap-2 text-muted", line.indent && "pl-5")}>
                  <span className="mt-[7px] size-1 shrink-0 rounded-pill bg-muted" />
                  {line.text}
                </li>
              );
            }
            const done = i === WAVERING ? wavering : line.done;
            return (
              <li key={i} className={cn("flex items-start gap-2", line.indent && "pl-5")}>
                <span
                  className={cn(
                    "mt-px grid size-3.5 shrink-0 place-items-center rounded-[3px] border transition-colors duration-[var(--cd-dur-press)] ease-out",
                    done ? "border-ink bg-ink text-surface" : "border-muted",
                  )}
                >
                  {done && <CheckIcon size={10} weight="bold" />}
                </span>
                <span
                  className={cn(
                    line.strike && "text-muted line-through",
                    line.mark && "rounded-[2px] bg-butter px-0.5 text-butter-ink",
                  )}
                >
                  {line.text}
                </span>
              </li>
            );
          })}
          <li className="flex items-center gap-2 pt-1 whitespace-nowrap">
            <span className="size-3.5 shrink-0 rounded-[3px] border border-muted" />
            <span className="min-w-0 overflow-hidden">{typed}</span>
            <span className="cd-caret -ml-1.5 h-4 w-px shrink-0 bg-ink" />
          </li>
        </ul>
      </div>
    </div>
  );
}
