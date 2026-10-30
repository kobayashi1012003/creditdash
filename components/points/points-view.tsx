"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import type { Program } from "@/data/types";
import {
  DEFAULT_CPP,
  PROGRAM_GROUP,
  PROGRAM_GROUPS,
  PROGRAM_GROUP_LABELS,
  PROGRAM_LABELS,
} from "@/data/programs";
import {
  addPrograms,
  clearValuation,
  removeProgram,
  setPointBalance,
  setValuation,
  useIsLoading,
  usePointBalances,
  useValuation,
  useValuations,
  useWallet,
} from "@/lib/data";
import { parseCents } from "@/lib/calculators/parse";
import { cents, centsNumber, pointsValue, pts, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shell/page-header";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, ConfirmDialogClose } from "@/components/ui/confirm-dialog";
import { NumberField } from "@/components/calculators/fields";
import { ProgramSheet } from "@/components/points/program-sheet";

/**
 * A second wallet, for points instead of cards. Each tracked program holds
 * a balance and a valuation; the valuation is the same number every
 * calculator reads, so editing it here changes the whole app.
 */
export function PointsView() {
  const isLoading = useIsLoading();
  const balances = usePointBalances();
  const valuations = useValuations();
  const wallet = useWallet();
  const [adding, setAdding] = useState(false);

  const tracked = useMemo(() => new Set(balances.map((b) => b.program)), [balances]);

  // Programs the wallet's cards earn, with the cards that earn them, so the
  // sheet can suggest them first and a row can say where its points come from.
  const earnedBy = useMemo(() => {
    const map = new Map<Program, string[]>();
    for (const { card } of wallet) {
      map.set(card.program, [...(map.get(card.program) ?? []), card.name]);
    }
    return map;
  }, [wallet]);

  const total = balances.reduce(
    (sum, b) => sum + pointsValue(b.balance, valuations[b.program] ?? 0),
    0,
  );

  const header = (
    <PageHeader
      title="Points"
      description="What you hold in each program, and what a point is worth to you."
      action={
        tracked.size > 0 ? (
          <Button onClick={() => setAdding(true)}>
            <PlusIcon size={17} />
            Add programs
          </Button>
        ) : undefined
      }
    />
  );

  const sheet = (
    <ProgramSheet
      open={adding}
      onOpenChange={setAdding}
      tracked={tracked}
      suggested={earnedBy}
      onConfirm={addPrograms}
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <div aria-busy aria-live="polite" className="space-y-5">
          <span className="sr-only">Loading your points</span>
          <div className="h-12 w-48 rounded-inner bg-surface" />
          {[0, 1].map((i) => (
            <div key={i} className="h-[220px] rounded-widget border border-line bg-surface" />
          ))}
        </div>
      </>
    );
  }

  if (tracked.size === 0) {
    const suggestions = [...earnedBy.keys()];
    return (
      <>
        {header}
        <Widget title="Add the programs you hold points in">
          <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">
            Track points from banks, airlines and hotels. You type each balance in
            by hand, and the page shows what it is worth at your valuation.
          </p>
          {suggestions.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] text-muted">Your cards earn</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((p) => (
                  <Button key={p} variant="outline" size="sm" onClick={() => addPrograms([p])}>
                    <PlusIcon size={14} />
                    {PROGRAM_LABELS[p]}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button className="mt-6" onClick={() => setAdding(true)}>
            <PlusIcon size={17} />
            Browse every program
          </Button>
        </Widget>
        {sheet}
      </>
    );
  }

  return (
    <>
      {header}

      <p className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-[40px] leading-none tabular-nums">{usd(total)}</span>
        <span className="text-[15px] text-muted">
          across {tracked.size} {tracked.size === 1 ? "program" : "programs"}, at your
          valuations
        </span>
      </p>

      <div className="space-y-5">
        {PROGRAM_GROUPS.map((group) => {
          const rows = balances.filter((b) => PROGRAM_GROUP[b.program] === group);
          if (rows.length === 0) return null;
          return (
            <Widget key={group} title={PROGRAM_GROUP_LABELS[group]} className="@container">
              {/* Wide, the column names are said once; narrow, each row
                  labels its own fields. */}
              <div
                aria-hidden
                className="mb-2 hidden gap-x-4 text-[12px] text-muted @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_9rem_12rem_7rem_2rem]"
              >
                <span />
                <span>Balance</span>
                <span>Cents per point</span>
                <span className="text-right">Worth</span>
              </div>
              <ul className="divide-y divide-line">
                {rows.map((b) => (
                  <ProgramRow
                    key={b.program}
                    program={b.program}
                    balance={b.balance}
                    earnedBy={earnedBy.get(b.program)}
                  />
                ))}
              </ul>
            </Widget>
          );
        })}
      </div>

      {sheet}
    </>
  );
}

/** How long a balance waits after the last keystroke before it is saved. */
const SAVE_DELAY_MS = 600;

function ProgramRow({
  program,
  balance,
  earnedBy,
}: {
  program: Program;
  balance: number;
  earnedBy?: string[];
}) {
  const { cpp, source } = useValuation(program);
  // What is being typed, until it is saved; then the stored balance again,
  // so a change made in another tab shows here.
  const [typed, setTyped] = useState<number | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; value: number } | null>(null);
  const label = PROGRAM_LABELS[program];

  // Saving on every keystroke would send a write per digit, and in an
  // account those can land out of order. A short pause batches them; leaving
  // the page saves whatever is still waiting.
  function queueBalance(value: number | null) {
    setTyped(value);
    if (pending.current) clearTimeout(pending.current.timer);
    if (value === null) {
      pending.current = null;
      return;
    }
    pending.current = {
      value,
      timer: setTimeout(async () => {
        pending.current = null;
        await setPointBalance(program, value);
        setTyped(undefined);
      }, SAVE_DELAY_MS),
    };
  }

  useEffect(
    () => () => {
      const p = pending.current;
      if (p) {
        clearTimeout(p.timer);
        void setPointBalance(program, p.value);
      }
    },
    [program],
  );

  const current = typed === undefined ? balance : typed;
  const shownBalance = current ?? 0;

  return (
    <li className="relative py-4 first:pt-0 last:pb-0">
      <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 @2xl:grid-cols-[minmax(0,1fr)_9rem_12rem_7rem_2rem] @2xl:items-center">
        <div className="col-span-2 flex min-w-0 items-start justify-between gap-3 @2xl:col-span-1">
          <div className="min-w-0">
            <p className="text-[15px] font-medium leading-snug">{label}</p>
            {earnedBy && (
              <p className="text-[13px] leading-snug text-muted">{earnedBy.join(", ")}</p>
            )}
          </div>
          <RemoveButton
            className="@2xl:hidden"
            label={label}
            onClick={() => (shownBalance > 0 ? setConfirming(true) : removeProgram(program))}
          />
        </div>

        <NumberField
          kind="points"
          label="Balance"
          value={current}
          onValue={queueBalance}
          placeholder="0"
          inputClassName="text-right"
          labelClassName="@2xl:sr-only"
        />

        <CentsField program={program} cpp={cpp} source={source} />

        <div className="col-span-2 flex items-baseline justify-between gap-3 @2xl:col-span-1 @2xl:block @2xl:text-right">
          <span className="text-[13px] text-muted @2xl:hidden">Worth</span>
          <span className="text-[17px] font-medium tabular-nums">
            {usd(pointsValue(shownBalance, cpp))}
          </span>
        </div>

        <RemoveButton
          className="hidden @2xl:inline-flex"
          label={label}
          onClick={() => (shownBalance > 0 ? setConfirming(true) : removeProgram(program))}
        />
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Stop tracking ${label}?`}
        actions={
          <>
            <ConfirmDialogClose render={<Button variant="ghost" />}>Keep it</ConfirmDialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pending.current) clearTimeout(pending.current.timer);
                pending.current = null;
                setConfirming(false);
                await removeProgram(program);
              }}
            >
              <TrashIcon size={16} />
              Stop tracking
            </Button>
          </>
        }
      >
        Its balance of {pts(shownBalance)} points is removed. What you set a point to be
        worth stays, so the calculators keep using it.
      </ConfirmDialog>
    </li>
  );
}

function RemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={`Stop tracking ${label}`}
      className={cn("shrink-0", className)}
    >
      <XIcon size={16} />
    </Button>
  );
}

/**
 * The valuation, always editable here because this page is where it lives.
 * Saved on Enter or on leaving the field; "Use default" clears the user's
 * own number so the row follows CreditDash's default again.
 */
function CentsField({
  program,
  cpp,
  source,
}: {
  program: Program;
  cpp: number;
  source: "yours" | "default";
}) {
  const id = useId();
  const noteId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? centsNumber(cpp);
  const parsed = parseCents(shown);
  const valid = parsed !== null && parsed > 0 && parsed < 100;

  async function commit() {
    if (draft === null) return;
    if (valid && parsed !== cpp) await setValuation(program, parsed);
    setDraft(null);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] leading-snug text-ink @2xl:sr-only">
        Cents per point
      </label>
      <div className="flex items-center gap-2">
        <div className="relative w-20 shrink-0">
          <Input
            id={id}
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            value={shown}
            aria-invalid={!valid || undefined}
            aria-describedby={noteId}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commit();
              if (e.key === "Escape") setDraft(null);
            }}
            className="h-10 rounded-inner bg-surface pr-6 text-right tabular-nums"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-sm text-muted">
            ¢
          </span>
        </div>
        <p id={noteId} className="min-w-0 text-[12px] leading-snug text-muted">
          {source === "yours" ? (
            <>
              Yours.{" "}
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  void clearValuation(program);
                }}
                aria-label={`Use the CreditDash default of ${cents(DEFAULT_CPP[program])} for ${PROGRAM_LABELS[program]}`}
                className="rounded-control text-ink underline decoration-line underline-offset-4 transition-[text-decoration-color] duration-[var(--cd-dur-hover)] ease-out hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Use default
              </button>
            </>
          ) : (
            "CreditDash default"
          )}
        </p>
      </div>
    </div>
  );
}
