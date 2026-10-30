"use client";

import { useId, useState, type ReactNode } from "react";
import type { Card, Program } from "@/data/types";
import {
  PROGRAMS,
  PROGRAM_GROUPS,
  PROGRAM_GROUP_LABELS,
  PROGRAM_LABELS,
} from "@/data/programs";
import { CARDS } from "@/data/cards.seed";
import { parseMoney, parsePoints } from "@/lib/calculators/parse";
import { pts } from "@/lib/format";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The inputs every calculator shares. Each one is labelled, reachable by
 * keyboard, and reads what people actually type ("$1,200", "30k") rather
 * than insisting on a bare number.
 */

const SELECT_CLASS =
  "h-10 w-full min-w-0 rounded-inner border border-line bg-surface px-3 text-sm text-ink transition-colors duration-[var(--cd-dur-hover)] ease-out hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function FieldLabel({
  htmlFor,
  children,
  hint,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  /** Small text under the label: a rate's condition, a limit. */
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-1.5", className)}>
      <Label htmlFor={htmlFor} className="block text-[13px] leading-snug text-ink">
        {children}
      </Label>
      {hint && <p className="mt-0.5 text-[12px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

function formatNumber(kind: "money" | "points", n: number) {
  if (kind === "points") return pts(n);
  return Number.isInteger(n) ? pts(n) : n.toFixed(2);
}

/**
 * A money or points field. Keeps what the person typed ("30k") while it
 * still means the same number, and shows the formatted number when the
 * value is set from outside, so "Fill in from my Tracker" lands in the box.
 */
export function NumberField({
  kind,
  label,
  hint,
  value,
  onValue,
  placeholder,
  className,
  inputClassName,
  labelHidden,
  labelClassName,
}: {
  kind: "money" | "points";
  label: ReactNode;
  hint?: ReactNode;
  value: number | null;
  onValue: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** For rows that carry their own visible label elsewhere. */
  labelHidden?: string;
  labelClassName?: string;
}) {
  const id = useId();
  const errorId = useId();
  const parse = kind === "money" ? parseMoney : parsePoints;
  const [draft, setDraft] = useState(value === null ? "" : formatNumber(kind, value));
  const shown = parse(draft) === value ? draft : value === null ? "" : formatNumber(kind, value);
  const invalid = shown.trim() !== "" && parse(shown) === null;

  return (
    <div className={className}>
      {labelHidden ? (
        <label htmlFor={id} className="sr-only">
          {labelHidden}
        </label>
      ) : (
        <FieldLabel htmlFor={id} hint={hint} className={labelClassName}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        {kind === "money" && (
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted">
            $
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode={kind === "money" ? "decimal" : "numeric"}
          autoComplete="off"
          enterKeyHint="done"
          value={shown}
          placeholder={placeholder ?? "0"}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => {
            // The field already prints its own $, so a typed one is dropped
            // rather than shown twice.
            const text = kind === "money" ? e.target.value.replace(/^\s*\$/, "") : e.target.value;
            setDraft(text);
            onValue(parse(text));
          }}
          className={cn(
            "h-10 rounded-inner bg-surface tabular-nums",
            kind === "money" && "pl-7",
            inputClassName,
          )}
        />
      </div>
      {invalid && (
        <p id={errorId} className="mt-1 text-[12px] text-[var(--destructive)]">
          {kind === "money" ? "Numbers only, like 1,200 or 1200.50." : "Numbers only, like 30,000 or 30k."}
        </p>
      )}
    </div>
  );
}

/**
 * Cards in the wallet first, then the rest of the catalog. A native select:
 * on a phone it opens the system picker, which is the fastest list there is.
 */
export function CardSelect({
  label,
  hint,
  wallet,
  value,
  onChange,
  allowNone,
  noneLabel = "None",
}: {
  label: string;
  hint?: ReactNode;
  wallet: Card[];
  value: string;
  onChange: (cardId: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const id = useId();
  const owned = new Set(wallet.map((c) => c.id));
  const rest = CARDS.filter((c) => !owned.has(c.id));
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {allowNone && <option value="">{noneLabel}</option>}
        {wallet.length > 0 && (
          <optgroup label="In your wallet">
            {wallet.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label={wallet.length > 0 ? "Other cards" : "All cards"}>
          {rest.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

/** Tracked programs first, then every program by group. */
export function ProgramSelect({
  label,
  tracked,
  value,
  onChange,
}: {
  label: string;
  tracked: Program[];
  value: Program;
  onChange: (program: Program) => void;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Program)}
        className={SELECT_CLASS}
      >
        {tracked.length > 0 && (
          <optgroup label="Your programs">
            {tracked.map((p) => (
              <option key={`t-${p}`} value={p}>
                {PROGRAM_LABELS[p]}
              </option>
            ))}
          </optgroup>
        )}
        {PROGRAM_GROUPS.map((group) => (
          <optgroup key={group} label={PROGRAM_GROUP_LABELS[group]}>
            {PROGRAMS.filter((p) => p.group === group && !tracked.includes(p.id)).map(
              (p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ),
            )}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/**
 * A segmented control that is a real radio group: one tab stop, arrow keys
 * move and pick, through the shared roving focus.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const labelId = useId();
  const index = options.findIndex((o) => o.value === value);
  const { onKeyDown, itemProps } = useRovingFocus(options.length, index, (i) =>
    onChange(options[i].value),
  );
  return (
    <div className={className}>
      <p id={labelId} className="mb-1.5 text-[13px] leading-snug text-ink">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="flex w-full rounded-inner border border-line bg-bg p-0.5"
      >
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              {...itemProps(i)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-8 min-w-0 flex-1 truncate rounded-control px-2 text-[13px]",
                "transition-[background-color,color,box-shadow,transform] duration-[var(--cd-dur-press)] ease-out active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                on
                  ? "bg-surface font-medium text-ink shadow-soft"
                  : "text-muted hover:text-ink",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The answer, first. A one-line verdict in the title voice, then what it
 * rests on. No colour: pastels belong to categories, so the verdict is
 * carried by type weight alone.
 */
export function Verdict({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn("rounded-inner border border-line bg-bg px-4 py-3.5", className)}
    >
      <p className="font-display text-xl leading-tight">{title}</p>
      {children && (
        <div className="mt-1.5 text-[14px] leading-relaxed text-muted">{children}</div>
      )}
    </div>
  );
}

export function NotAdvice({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-5 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
      {children ? <>{children} </> : null}Not financial advice.
    </p>
  );
}
