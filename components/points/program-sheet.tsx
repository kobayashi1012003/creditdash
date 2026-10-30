"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { Program } from "@/data/types";
import {
  DEFAULT_CPP,
  PROGRAMS,
  PROGRAM_GROUPS,
  PROGRAM_GROUP_LABELS,
} from "@/data/programs";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tick } from "@/components/wallet/add-card-sheet";
import { cents } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useIsDesktop } from "@/lib/use-media-query";

/**
 * Every program, searchable, several picked at once. The same surface as
 * the card sheet: a right panel on desktop, a bottom sheet on a phone.
 * Programs the user's cards earn come first, under their own heading.
 */
export function ProgramSheet({
  open,
  onOpenChange,
  tracked,
  suggested,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracked: ReadonlySet<Program>;
  /** Programs the wallet's cards earn, with the cards that earn them. */
  suggested: Map<Program, string[]>;
  onConfirm: (programs: Program[]) => Promise<void> | void;
}) {
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Program[]>([]);
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const available = PROGRAMS.filter(
    (p) => !tracked.has(p.id) && (!q || p.label.toLowerCase().includes(q)),
  );
  const fromCards = available.filter((p) => suggested.has(p.id));
  const sections = [
    { key: "cards", title: "Earned by your cards", items: fromCards },
    ...PROGRAM_GROUPS.map((group) => ({
      key: group,
      title: PROGRAM_GROUP_LABELS[group],
      items: available.filter((p) => p.group === group && !suggested.has(p.id)),
    })),
  ].filter((s) => s.items.length > 0);

  function close() {
    setQuery("");
    setPicked([]);
    onOpenChange(false);
  }

  function toggle(id: Program) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function confirm() {
    setBusy(true);
    await onConfirm(picked);
    setBusy(false);
    close();
  }

  const n = picked.length;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="data-[swipe-direction=right]:sm:[--drawer-content-width:28rem]">
        <div className="border-b border-line px-5 pt-4 pb-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <DrawerTitle className="font-display text-xl leading-none">Add programs</DrawerTitle>
            {n > 0 && (
              <span className="text-[13px] tabular-nums text-muted" aria-live="polite">
                {n} selected
              </span>
            )}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon
              size={16}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto text-muted"
            />
            <Input
              autoFocus={isDesktop}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search airlines, hotels, banks"
              aria-label="Search programs"
              className="h-10 rounded-inner pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {sections.length === 0 ? (
            <p className="py-6 text-sm leading-relaxed text-muted">
              {q
                ? `Nothing matches "${query.trim()}".`
                : "You are already tracking every program on the list."}
            </p>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => (
                <section key={section.key} aria-labelledby={`ps-${section.key}`}>
                  <h3 id={`ps-${section.key}`} className="mb-2 text-[13px] font-medium text-muted">
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items.map((p) => {
                      const on = picked.includes(p.id);
                      const cards = suggested.get(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggle(p.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-inner border px-3 py-2.5 text-left",
                              "transition-[border-color,background-color,transform] duration-[var(--cd-dur-press)] ease-out",
                              "active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                              on ? "border-[var(--cd-mint-ink)] bg-mint/40" : "border-line hover:border-muted",
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] leading-snug">{p.label}</span>
                              <span className="block text-[13px] text-muted">
                                {cards ? `${cards.join(", ")}. ` : ""}
                                {cents(DEFAULT_CPP[p.id])} a point by default
                              </span>
                            </span>
                            <Tick on={on} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={confirm} disabled={n === 0 || busy}>
            {n > 0 ? `Add ${n} ${n === 1 ? "program" : "programs"}` : "Pick programs to add"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
