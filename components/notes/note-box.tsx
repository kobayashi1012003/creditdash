"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SparkleIcon } from "@phosphor-icons/react";
import { setNote, usePlan } from "@/lib/data";
import { NOTE_MAX } from "@/lib/data/schema";
import { hasFeature } from "@/lib/plan";
import { cn } from "@/lib/cn";

/** Saved this long after the last keystroke, so an account gets one write per pause. */
const SAVE_AFTER_MS = 600;

/**
 * A note: the general one (`cardId` null) or one credit's on one card. It
 * saves itself a moment after typing stops, and on leaving the box, so
 * there is no Save button to forget. Emptying it deletes the note.
 *
 * Premium writes notes. On Free the box says so, and any note kept from
 * Premium still shows, read only, rather than disappearing.
 */
export function NoteBox({
  cardId,
  creditId,
  value,
  label,
  placeholder,
  rows = 3,
  autoFocus = false,
  className,
}: {
  cardId: string | null;
  creditId: string | null;
  /** The saved text. */
  value: string;
  /** What the box is for, read by screen readers: "Note on Uber Cash". */
  label: string;
  placeholder: string;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
}) {
  const id = useId();
  const plan = usePlan();
  const canWrite = hasFeature(plan, "notes");
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);

  // Another tab or device changed the note: take it, unless mid-edit here.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (pending.current === null) setDraft(value);
  }

  async function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const text = pending.current;
    if (text === null) return;
    pending.current = null;
    setStatus("saving");
    await setNote(cardId, creditId, text);
    setStatus("saved");
  }

  // Leaving the page mid-pause still saves.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current !== null) void setNote(cardId, creditId, pending.current);
    },
    [cardId, creditId],
  );

  if (!canWrite) {
    return (
      <div className={cn("rounded-inner border border-line bg-bg px-3.5 py-3", className)}>
        {value && (
          <p className="mb-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">{value}</p>
        )}
        <p className="text-[13px] leading-relaxed text-muted">
          {value ? "Editing notes comes with Premium. " : "Notes come with Premium. "}
          <Link
            href="/settings#plan"
            className="inline-flex items-center gap-1 rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <SparkleIcon size={13} weight="fill" aria-hidden />
            See Premium
          </Link>
        </p>
      </div>
    );
  }

  const left = NOTE_MAX - draft.length;

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        value={draft}
        rows={rows}
        maxLength={NOTE_MAX}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          pending.current = e.target.value;
          setStatus("idle");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS);
        }}
        onBlur={() => void flush()}
        className={cn(
          "block w-full resize-y rounded-inner border border-line bg-surface px-3.5 py-2.5",
          // 16px on phones so iOS does not zoom into the box.
          "text-[16px] leading-relaxed text-ink placeholder:text-muted md:text-[14px]",
          "transition-[border-color] duration-[var(--cd-dur-hover)] ease-out hover:border-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      />
      <p className="mt-1.5 flex justify-between gap-3 text-[12px] text-muted" aria-live="polite">
        <span>{status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Saves as you type"}</span>
        {left < 200 && <span className="tabular-nums">{left} characters left</span>}
      </p>
    </div>
  );
}
