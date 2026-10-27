import { cn } from "@/lib/cn";

/**
 * The name, set in the display face. "CreditDash" is a placeholder brand
 * (PRODUCT.md, Brand Commitments), so this stays a wordmark rather than a
 * drawn logo until the name is settled.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[22px] leading-none tracking-[-0.01em]",
        className,
      )}
    >
      CreditDash
    </span>
  );
}
