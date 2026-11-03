import type { CardCredit, TrackerColor, TrackerPrefs } from "@/data/types";
import { categoryStyle } from "@/lib/categories";

/**
 * Applies someone's Tracker arrangement to a card's credits: their order
 * first, then any credit they have not placed (new to the catalog since)
 * in catalog order, with hidden ones split out.
 */
export function arrangeCredits(
  credits: CardCredit[],
  prefs: TrackerPrefs | undefined,
): { shown: CardCredit[]; hidden: CardCredit[]; all: CardCredit[] } {
  const order = prefs?.order ?? [];
  const rank = new Map(order.map((id, i) => [id, i]));
  const all = [...credits].sort(
    (a, b) =>
      (rank.get(a.id) ?? order.length + credits.indexOf(a)) -
      (rank.get(b.id) ?? order.length + credits.indexOf(b)),
  );
  const hiddenIds = new Set(prefs?.hidden ?? []);
  return {
    all,
    shown: all.filter((c) => !hiddenIds.has(c.id)),
    hidden: all.filter((c) => hiddenIds.has(c.id)),
  };
}

/** The ink a colour choice paints filled slots with. */
export const TRACKER_COLOR_INK: Record<TrackerColor, string> = {
  mint: "var(--cd-mint-ink)",
  lavender: "var(--cd-lavender-ink)",
  peach: "var(--cd-peach-ink)",
  sky: "var(--cd-sky-ink)",
  butter: "var(--cd-butter-ink)",
  ink: "var(--cd-text)",
};

export const TRACKER_COLOR_LABEL: Record<TrackerColor, string> = {
  mint: "Mint",
  lavender: "Lavender",
  peach: "Peach",
  sky: "Sky",
  butter: "Butter",
  ink: "Ink",
};

/** A credit's slot colour: the user's choice, else its category's. */
export function creditTint(credit: CardCredit, prefs: TrackerPrefs | undefined): string {
  const chosen = prefs?.colors?.[credit.id];
  if (chosen) return TRACKER_COLOR_INK[chosen];
  return credit.category ? categoryStyle(credit.category).color : "var(--cd-text)";
}
