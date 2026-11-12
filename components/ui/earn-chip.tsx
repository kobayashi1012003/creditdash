import { cn } from "@/lib/cn";
import {
  CATEGORY_LABELS,
  categoryStyle,
  type Category,
} from "@/lib/categories";
import { CategoryIcon } from "@/components/ui/category-icon";

type EarnChipProps = {
  category: Category;
  /** Points per dollar, e.g. 4 renders as "4x Dining". */
  multiplier: number;
  /** Cash back: renders as "3% Dining". */
  percent?: boolean;
  /**
   * Where the rate applies when it is not everywhere ("through Capital One
   * Travel"). Marks the chip with an asterisk; the caller prints the
   * matching footnote.
   */
  where?: string;
  className?: string;
};

/** The earn rate badge that sits under a card face in the wallet. */
export function EarnChip({ category, multiplier, percent, where, className }: EarnChipProps) {
  return (
    <span
      style={categoryStyle(category)}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-[13px] font-medium",
        category === "other" && "border border-line",
        className,
      )}
    >
      <CategoryIcon category={category} size={14} className="shrink-0" />
      <span>
        {multiplier}{percent ? "%" : "x"} {CATEGORY_LABELS[category]}
        {where && (
          <>
            <span aria-hidden>*</span>
            <span className="sr-only">, {where}</span>
          </>
        )}
      </span>
    </span>
  );
}
