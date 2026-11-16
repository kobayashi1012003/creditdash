"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, NotepadIcon } from "@phosphor-icons/react";
import { useIsLoading, useNotes, useWallet } from "@/lib/data";
import { TRACKER_CARD_KEY, useStoredValue } from "@/lib/use-stored-value";
import { Widget } from "@/components/ui/widget";
import { CardFace } from "@/components/ui/card-face";
import { NoteBox } from "@/components/notes/note-box";

/**
 * The Notes page: one general note, then every credit note in the wallet,
 * grouped by card in wallet order. Credit notes are written beside their
 * credit in the Tracker; here they can be read together and edited too.
 */
export function NotesView() {
  const notes = useNotes();
  const entries = useWallet();
  const isLoading = useIsLoading();
  const router = useRouter();
  const [, setTrackerCard] = useStoredValue(TRACKER_CARD_KEY);

  if (isLoading) {
    return (
      <div aria-busy aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading your notes</span>
        <div className="h-[220px] rounded-widget border border-line bg-surface" />
        <div className="h-[160px] rounded-widget border border-line bg-surface" />
      </div>
    );
  }

  const cards = entries
    .map((entry) => ({
      entry,
      credits: entry.card.credits.filter((c) => notes.credits[entry.card.id]?.[c.id]),
    }))
    .filter((x) => x.credits.length > 0);

  function openTracker(cardId: string) {
    setTrackerCard(cardId);
    router.push("/tracker");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Widget title="General">
        <NoteBox
          cardId={null}
          creditId={null}
          value={notes.general}
          label="General notes"
          placeholder="Plans, reminders, which card to cancel before its fee comes round."
          rows={6}
        />
      </Widget>

      <section aria-labelledby="credit-notes">
        <h2 id="credit-notes" className="font-display text-xl leading-tight">
          On your credits
        </h2>
        {cards.length === 0 ? (
          <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-muted">
            Notes on a credit show here too. Add one with the{" "}
            <NotepadIcon size={15} aria-label="notepad" className="inline-block align-[-2px] text-ink" />{" "}
            beside any credit in the{" "}
            <Link
              href="/tracker"
              className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Tracker
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-6">
            {cards.map(({ entry, credits }) => {
              const name = entry.userCard.nickname ?? entry.card.name;
              return (
                <li key={entry.card.id}>
                  <Widget>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-14 shrink-0">
                          <CardFace card={entry.card} sizes="56px" />
                        </span>
                        <h3 className="truncate text-[17px] font-medium">{name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openTracker(entry.card.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-control text-[13px] text-muted transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        Open in Tracker
                        <ArrowRightIcon size={13} aria-hidden />
                      </button>
                    </div>
                    <ul className="space-y-5">
                      {credits.map((credit) => (
                        <li key={credit.id}>
                          <p className="mb-2 text-[15px]">{credit.name}</p>
                          <NoteBox
                            cardId={entry.card.id}
                            creditId={credit.id}
                            value={notes.credits[entry.card.id]?.[credit.id] ?? ""}
                            label={`Note on ${credit.name}, ${name}`}
                            placeholder="Empty this to delete the note."
                            rows={2}
                          />
                        </li>
                      ))}
                    </ul>
                  </Widget>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
