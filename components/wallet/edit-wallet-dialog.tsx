"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowCounterClockwiseIcon, XIcon } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { WalletEntry } from "@/lib/data";
import { CardFace } from "@/components/ui/card-face";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Edit, as one centred window: every card in a numbered slot, in the saved
 * order. Drag a card to another slot and the cards between move over by
 * one; nothing else moves, and nothing is saved until "Save changes", so a
 * slip of the finger is undone by Cancel. Cards marked for removal stay in
 * their slot, struck through, until then too.
 *
 * Slots are all one size, so a card always lands where it was dropped.
 * The old in-page edit sized each card by the chips under it, and cards of
 * different heights made the drop target jump (owner, 16 November 2026).
 */

/** A slot is about 210px wide in the three-column dialog, 45vw on a phone. */
const SLOT_SIZES = "(max-width: 640px) 45vw, 210px";

export type WalletEdit = { order: string[]; removing: string[] };

export function EditWalletDialog({
  open,
  onOpenChange,
  entries,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: WalletEntry[];
  onSave: (edit: WalletEdit) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-band/55",
            "transition-opacity duration-[var(--cd-dur-panel)] ease-out",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-2 z-50 flex flex-col overflow-hidden rounded-widget border border-line bg-surface text-ink shadow-lifted",
            // From sm a centred window sized to its slots.
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[min(820px,calc(100dvh-64px))] sm:w-[min(760px,calc(100vw-64px))]",
            "[--dlg-t:0px] sm:[--dlg-t:-50%] [--dlg-s:1]",
            "[transform:translate(var(--dlg-t),var(--dlg-t))_scale(var(--dlg-s))]",
            "transition-[opacity,transform] duration-[var(--cd-dur-panel)] ease-[var(--cd-ease-drawer)]",
            "data-starting-style:opacity-0 data-starting-style:[--dlg-s:0.96]",
            "data-ending-style:opacity-0 data-ending-style:[--dlg-s:0.96]",
            "focus-visible:outline-none",
          )}
        >
          {/* Mounted fresh on each open, so it starts from the saved order. */}
          {open && <Editor entries={entries} onSave={onSave} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Editor({ entries, onSave }: { entries: WalletEntry[]; onSave: (edit: WalletEdit) => void }) {
  const byId = new Map(entries.map((e) => [e.card.id, e]));
  const [order, setOrder] = useState(() => entries.map((e) => e.card.id));
  const [removing, setRemoving] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);

  const sensors = useSensors(
    // A mouse moves a few pixels before it drags, so a click stays a click.
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A finger holds for a moment first, so a swipe still scrolls the list.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const moved = order.some((id, i) => id !== entries[i]?.card.id);
  const changed = moved || removing.length > 0;
  const active = dragging ? byId.get(dragging) : undefined;

  // Said to screen readers in the card's name and slot, not its id.
  const nameOf = (id: unknown) => {
    const e = byId.get(String(id));
    return e ? (e.userCard.nickname ?? e.card.name) : "Card";
  };
  const slotOf = (id: unknown) => order.indexOf(String(id)) + 1;
  const announcements = {
    onDragStart: ({ active }: { active: { id: unknown } }) =>
      `Picked up ${nameOf(active.id)}, in slot ${slotOf(active.id)}. Use the arrow keys to move it, space to drop it, Escape to cancel.`,
    onDragOver: ({ active, over }: { active: { id: unknown }; over: { id: unknown } | null }) =>
      over ? `${nameOf(active.id)} is over slot ${slotOf(over.id)}.` : `${nameOf(active.id)} is not over a slot.`,
    onDragEnd: ({ active, over }: { active: { id: unknown }; over: { id: unknown } | null }) =>
      over ? `${nameOf(active.id)} dropped in slot ${slotOf(over.id)}.` : `${nameOf(active.id)} put back.`,
    onDragCancel: ({ active }: { active: { id: unknown } }) => `Move cancelled. ${nameOf(active.id)} put back.`,
  };

  function onDragStart(e: DragStartEvent) {
    setDragging(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(String(active.id)), o.indexOf(String(over.id))));
  }
  function toggle(id: string) {
    setRemoving((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 sm:px-6">
        <div>
          <Dialog.Title className="font-display text-2xl leading-tight">Edit wallet</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Drag a card to a new slot, or tab to one and press space. Nothing changes until you save.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close without saving"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-pill border border-line text-muted",
            "transition-[color,border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted hover:text-ink active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          )}
        >
          <XIcon size={18} />
        </Dialog.Close>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:var(--cd-border)_transparent] [scrollbar-width:thin] sm:px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToFirstScrollableAncestor]}
          accessibility={{ announcements }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <ol className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4">
              {order.map((id, i) => {
                const entry = byId.get(id);
                if (!entry) return null;
                return (
                  <Slot
                    key={id}
                    entry={entry}
                    position={i + 1}
                    marked={removing.includes(id)}
                    onToggle={() => toggle(id)}
                  />
                );
              })}
            </ol>
          </SortableContext>
          {/* The lifted card follows the pointer above everything, and
              settles into its new slot on drop. */}
          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.32, 0.72, 0, 1)" }}>
            {active ? (
              <div className="rotate-[1.5deg] scale-[1.03] rounded-card shadow-lifted">
                <CardFace card={active.card} sizes={SLOT_SIZES} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <p className="text-[13px] text-muted" aria-live="polite">
          {removing.length > 0
            ? `${removing.length} marked for removal`
            : moved
              ? "New order, not saved yet"
              : `${order.length} ${order.length === 1 ? "card" : "cards"}`}
        </p>
        <div className="flex gap-2">
          <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
          <Button disabled={!changed} onClick={() => onSave({ order, removing })}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  );
}

function Slot({
  entry,
  position,
  marked,
  onToggle,
}: {
  entry: WalletEntry;
  position: number;
  marked: boolean;
  onToggle: () => void;
}) {
  const { card, userCard } = entry;
  const name = userCard.nickname ?? card.name;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="min-w-0"
    >
      <div className="relative">
        {/* The slot's outline shows through where the card was lifted, so it
            reads as a place a card snaps into. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-card border-2 border-dashed border-line"
        />
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Move ${name}, slot ${position}`}
          className={cn(
            "relative cursor-grab touch-manipulation rounded-card active:cursor-grabbing",
            "transition-opacity duration-[var(--cd-dur-hover)] ease-out",
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
            isDragging && "opacity-0",
          )}
        >
          <CardFace card={card} dimmed={marked} sizes={SLOT_SIZES} />
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 left-2 grid h-6 min-w-6 place-items-center rounded-pill bg-bg/85 px-1.5 text-[12px] font-medium text-ink tabular-nums backdrop-blur-sm"
          >
            {position}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className={cn("truncate text-[13px] font-medium", marked && "text-muted line-through")}>
          {name}
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={marked}
          aria-label={marked ? `Keep ${name}` : `Remove ${name}`}
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 rounded-control px-2 text-[12px] font-medium",
            "transition-[color,background-color,transform] duration-[var(--cd-dur-press)] ease-out active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            marked
              ? "bg-panel text-ink hover:bg-line"
              : "text-muted hover:bg-panel hover:text-destructive",
          )}
        >
          {marked ? <ArrowCounterClockwiseIcon size={13} /> : <XIcon size={13} />}
          {marked ? "Keep" : "Remove"}
        </button>
      </div>
    </li>
  );
}
