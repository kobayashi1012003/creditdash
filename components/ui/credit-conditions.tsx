import type { CardCredit } from "@/data/types";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The conditions that most often cost someone a credit, as small tags
 * beside its name: enrolling before the purchase, and spend that unlocks
 * it. Renders nothing for a credit with neither.
 */
export function CreditConditions({
  credit,
  className,
}: {
  credit: Pick<CardCredit, "enroll" | "spendToUnlock">;
  className?: string;
}) {
  if (!credit.enroll && !credit.spendToUnlock) return null;
  return (
    <span className={cn("inline-flex flex-wrap gap-1 align-middle", className)}>
      {credit.enroll && <Tag>Enroll first</Tag>}
      {credit.spendToUnlock ? (
        <Tag>After {usd(credit.spendToUnlock)} spend in a year</Tag>
      ) : null}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-control border border-line px-1.5 py-px text-[11.5px] leading-snug text-muted">
      {children}
    </span>
  );
}
