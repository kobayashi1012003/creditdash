import { cn } from "@/lib/cn";
import {
  CATEGORY_LABELS,
  categoryStyle,
  type Category,
} from "@/lib/categories";

type EarnChipProps = {
  category: Category;
  /** Points per dollar, e.g. 4 renders as "4x Dining". */
  multiplier: number;
  className?: string;
};

/** The earn rate badge that sits under a card face in the wallet. */
export function EarnChip({ category, multiplier, className }: EarnChipProps) {
  return (
    <span
      style={categoryStyle(category)}
      className={cn(
        "inline-flex items-center rounded-control px-2.5 py-1 text-[13px] font-medium",
        category === "other" && "border border-line",
        className,
      )}
    >
      {multiplier}x {CATEGORY_LABELS[category]}
    </span>
  );
}
