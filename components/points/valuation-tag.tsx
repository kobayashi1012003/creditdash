"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { Program } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/programs";
import { clearValuation, setValuation, useValuation } from "@/lib/data";
import { parseCents } from "@/lib/calculators/parse";
import { cents, centsNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";

/**
 * Where a result's cents-per-point came from, with the number editable in
 * place. It writes the same stored value as the Points page, so changing it
 * here changes every figure in the app.
 */
export function ValuationTag({
  program,
  className,
}: {
  program: Program;
  className?: string;
}) {
  const { cpp, source } = useValuation(program);
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const label = source === "yours" ? "Your valuation" : "CreditDash default";

  // Hand focus back to where the edit started, as a drawer does. After the
  // commit, because the trigger only exists again once the editor is gone.
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      trigger.current?.focus();
    }
  }, [editing]);

  function close() {
    returnFocus.current = true;
    setEditing(false);
  }

  if (editing) {
    return (
      <ValuationEditor
        program={program}
        cpp={cpp}
        source={source}
        onDone={close}
        className={className}
      />
    );
  }

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted", className)}>
      <span>
        {label}: <span className="tabular-nums text-ink">{cents(cpp)}</span>
      </span>
      <button
        ref={trigger}
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Change what a ${PROGRAM_LABELS[program]} point is worth to you`}
        className="inline-flex h-7 items-center gap-1 rounded-control px-1.5 text-[13px] text-muted underline decoration-line underline-offset-4 transition-[color,text-decoration-color,transform] duration-[var(--cd-dur-hover)] ease-out hover:text-ink hover:decoration-current active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <PencilSimpleIcon size={13} aria-hidden />
        Change
      </button>
    </p>
  );
}

function ValuationEditor({
  program,
  cpp,
  source,
  onDone,
  className,
}: {
  program: Program;
  cpp: number;
  source: "yours" | "default";
  onDone: () => void;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(centsNumber(cpp));
  const parsed = parseCents(draft);
  const valid = parsed !== null && parsed > 0 && parsed < 100;

  async function save() {
    if (valid && parsed !== cpp) await setValuation(program, parsed);
    onDone();
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-[13px]", className)}>
      <label htmlFor={id} className="relative text-muted">
        <span className="sr-only">{PROGRAM_LABELS[program]}, </span>Cents per point
      </label>
      <div className="relative">
        <Input
          id={id}
          autoFocus
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          value={draft}
          aria-invalid={!valid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") onDone();
          }}
          className="h-8 w-20 rounded-inner bg-surface pr-6 text-right tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-muted">
          ¢
        </span>
      </div>
      <button
        type="button"
        onClick={() => void save()}
        disabled={!valid}
        className="h-8 rounded-control bg-ink px-3 text-[13px] font-medium text-bg transition-[opacity,transform] duration-[var(--cd-dur-press)] ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Save
      </button>
      {source === "yours" && (
        <button
          type="button"
          onClick={async () => {
            await clearValuation(program);
            onDone();
          }}
          className="h-8 rounded-control px-2 text-[13px] text-muted transition-[color,transform] duration-[var(--cd-dur-hover)] ease-out hover:text-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Use default
        </button>
      )}
      <button
        type="button"
        onClick={onDone}
        className="h-8 rounded-control px-2 text-[13px] text-muted transition-[color,transform] duration-[var(--cd-dur-hover)] ease-out hover:text-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Cancel
      </button>
    </div>
  );
}
