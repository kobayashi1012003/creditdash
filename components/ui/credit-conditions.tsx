import { HourglassMediumIcon } from "@phosphor-icons/react";
import type { CardCredit } from "@/data/types";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2027-09-30" reads "Sep 2027". */
function monthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * The conditions that most often cost someone a credit, as small tags
 * beside its name: a limited-time credit that will not renew, enrolling
 * before the purchase, and spend that unlocks it. Renders nothing for a
 * credit with none.
 *
 * The limited tag is drawn in ink, not muted, because mistaking a promotion
 * for a permanent benefit changes what the card is worth.
 */
export function CreditConditions({
  credit,
  className,
}: {
  credit: Pick<CardCredit, "enroll" | "spendToUnlock" | "endsOn">;
  className?: string;
}) {
  if (!credit.enroll && !credit.spendToUnlock && !credit.endsOn) return null;
  return (
    <span className={cn("inline-flex flex-wrap gap-1 align-middle", className)}>
      {credit.endsOn && (
        <span
          title="A limited-time credit. It ends on this date and does not renew."
          className="inline-flex items-center gap-1 rounded-control border border-ink px-1.5 py-px text-[11.5px] leading-snug font-medium text-ink"
        >
          <HourglassMediumIcon size={11} weight="bold" aria-hidden />
          Limited, ends {monthYear(credit.endsOn)}
        </span>
      )}
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
