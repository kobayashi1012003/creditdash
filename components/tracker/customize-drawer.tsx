"use client";

import Link from "next/link";
import { useId } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import {
  DotsSixVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  LightningIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { TRACKER_COLORS, type Card, type CardCredit, type TrackerColor, type UserCard } from "@/data/types";
import { startAutoFill } from "@/lib/credits/autofill";
import { runAutoFill, setTrackerPrefs, usePlan } from "@/lib/data";
import { hasFeature } from "@/lib/plan";
import { arrangeCredits, creditTint, TRACKER_COLOR_INK, TRACKER_COLOR_LABEL } from "@/lib/tracker-prefs";
import { useIsDesktop } from "@/lib/use-media-query";
import { cn } from "@/lib/cn";
import { usd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const PERIOD: Record<CardCredit["period"], string> = {
  monthly: "a month",
  quarterly: "a quarter",
  semiannual: "every half year",
  annual: "a year",
};

/**
 * Arranging one card's Tracker (owner, 3 November 2026): drag credits into
 * the order wanted, hide the ones not worth tracking, pick each one's
 * colour, and (Premium) have a credit ticked automatically as each period
 * opens. Saved with the card, so it follows the account to every device.
 */
export function CustomizeDrawer({
  card,
  userCard,
  open,
  onOpenChange,
}: {
  card: Card;
  userCard: UserCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useIsDesktop();
  const plan = usePlan();
  const canAutoFill = hasFeature(plan, "autofill");
  const prefs = userCard.prefs;
  const { all } = arrangeCredits(card.credits, prefs);
  const hidden = new Set(prefs?.hidden ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const save = (update: Parameters<typeof setTrackerPrefs>[1]) => setTrackerPrefs(card.id, update);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = all.map((c) => c.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    void save((p) => ({ ...p, order: next }));
  }

  async function setAutoFill(credit: CardCredit, on: boolean) {
    if (on) {
      const entry = startAutoFill(
        {
          period: credit.period,
          resetBasis: credit.resetBasis,
          anniversaryMonth: userCard.anniversaryMonth,
          anniversaryDay: userCard.anniversaryDay,
        },
        new Date(),
      );
      await save((p) => ({ ...p, autofill: { ...p.autofill, [credit.id]: entry } }));
      // Fill the period open now straight away, rather than at midnight.
      await runAutoFill(new Date());
    } else {
      await save((p) => {
        const rest = { ...p.autofill };
        delete rest[credit.id];
        return { ...p, autofill: rest };
      });
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="data-[swipe-direction=right]:sm:[--drawer-content-width:28rem]">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <DrawerHeader className="gap-0 px-5 pt-5 pb-0 text-left">
            <DrawerTitle className="font-display text-[24px] leading-tight">Customize</DrawerTitle>
            <DrawerDescription className="mt-1 text-[14px] leading-relaxed text-muted">
              {userCard.nickname ?? card.name}. Drag to reorder, hide what you do not use, and pick
              each credit&apos;s colour. Hidden credits leave your totals too.
            </DrawerDescription>
          </DrawerHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext items={all.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-5 space-y-2 px-5">
                {all.map((credit) => (
                  <CreditPrefRow
                    key={credit.id}
                    credit={credit}
                    hidden={hidden.has(credit.id)}
                    color={prefs?.colors?.[credit.id] ?? null}
                    tint={creditTint(credit, undefined)}
                    autoFill={Boolean(prefs?.autofill?.[credit.id])}
                    canAutoFill={canAutoFill}
                    onHidden={(h) =>
                      save((p) => {
                        const set = new Set(p.hidden ?? []);
                        if (h) set.add(credit.id);
                        else set.delete(credit.id);
                        return { ...p, hidden: [...set] };
                      })
                    }
                    onColor={(c) =>
                      save((p) => {
                        const colors = { ...p.colors };
                        if (c) colors[credit.id] = c;
                        else delete colors[credit.id];
                        return { ...p, colors };
                      })
                    }
                    onAutoFill={(on) => setAutoFill(credit, on)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="mx-5 mt-6 rounded-inner bg-panel px-4 py-3.5 text-[13px] leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium">
              <LightningIcon size={14} weight="fill" aria-hidden />
              Auto-fill
              {!canAutoFill && (
                <span className="ml-1 rounded-control border border-line px-1.5 py-px text-[11.5px] font-normal text-muted">
                  Premium
                </span>
              )}
            </p>
            <p className="mt-1 text-muted">
              Ticks a credit for you the moment each period starts, at midnight where you are: the
              1st for monthly credits, or your card anniversary for anniversary ones. Untick a
              period and it stays unticked.
            </p>
            {!canAutoFill && (
              <Button size="sm" className="mt-3" nativeButton={false} render={<Link href="/settings#plan" />}>
                See Premium
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <Button
            variant="ghost"
            onClick={() =>
              save((p) => ({ autofill: p.autofill }))
            }
          >
            Reset layout
          </Button>
          <DrawerClose render={<Button>Done</Button>} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CreditPrefRow({
  credit,
  hidden,
  color,
  tint,
  autoFill,
  canAutoFill,
  onHidden,
  onColor,
  onAutoFill,
}: {
  credit: CardCredit;
  hidden: boolean;
  color: TrackerColor | null;
  /** The category colour, offered as the first swatch. */
  tint: string;
  autoFill: boolean;
  canAutoFill: boolean;
  onHidden: (hidden: boolean) => void;
  onColor: (color: TrackerColor | null) => void;
  onAutoFill: (on: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: credit.id });
  const autoId = useId();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative rounded-inner border border-line bg-surface py-3 pr-3 pl-1.5",
        isDragging && "z-10 shadow-lifted",
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move ${credit.name}`}
          className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-control text-muted transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-focus"
        >
          <DotsSixVerticalIcon size={18} weight="bold" />
        </button>

        <div className={cn("min-w-0 flex-1 pt-1", hidden && "opacity-50")}>
          <p className="text-[14px] leading-snug">{credit.name}</p>
          <p className="text-[12px] text-muted">
            {usd(credit.amount)} {PERIOD[credit.period]}
          </p>

          {/* Colour: the category's own, or one of the palette. */}
          <div role="radiogroup" aria-label={`Colour for ${credit.name}`} className="mt-2.5 flex flex-wrap gap-1.5">
            <Swatch label="Category colour" ink={tint} selected={color === null} onSelect={() => onColor(null)} auto />
            {TRACKER_COLORS.map((c) => (
              <Swatch
                key={c}
                label={TRACKER_COLOR_LABEL[c]}
                ink={TRACKER_COLOR_INK[c]}
                selected={color === c}
                onSelect={() => onColor(c)}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <Switch
              checked={autoFill && canAutoFill}
              disabled={!canAutoFill || hidden}
              onCheckedChange={(on) => onAutoFill(on)}
              aria-labelledby={autoId}
              size="sm"
              className="data-checked:bg-ink data-unchecked:bg-line"
            />
            <span
              id={autoId}
              onClick={() => canAutoFill && !hidden && onAutoFill(!autoFill)}
              className={cn("flex items-center gap-1 text-[13px] select-none", canAutoFill && !hidden ? "cursor-pointer" : "text-muted")}
            >
              {!canAutoFill && <LockSimpleIcon size={12} aria-hidden />}
              Auto-fill
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={hidden}
          aria-label={hidden ? `Show ${credit.name}` : `Hide ${credit.name}`}
          onClick={() => onHidden(!hidden)}
          className="mt-0.5 shrink-0"
        >
          {hidden ? <EyeSlashIcon size={17} /> : <EyeIcon size={17} />}
        </Button>
      </div>
    </li>
  );
}

function Swatch({
  label,
  ink,
  selected,
  onSelect,
  auto = false,
}: {
  label: string;
  ink: string | null;
  selected: boolean;
  onSelect: () => void;
  auto?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onSelect}
      className={cn(
        "grid size-6 place-items-center rounded-pill border transition-[transform,border-color] duration-[var(--cd-dur-press)] ease-out active:scale-[0.9]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        selected ? "border-ink" : "border-transparent hover:border-muted",
      )}
    >
      <span
        className={cn("size-4 rounded-pill", auto && "ring-1 ring-offset-1 ring-line ring-offset-surface")}
        style={ink ? { backgroundColor: ink } : undefined}
      />
    </button>
  );
}
