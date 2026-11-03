import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from "@/lib/plan";
import { cn } from "@/lib/cn";

/**
 * Free, Premium monthly and Premium yearly side by side, for the home page
 * and the Pricing page. Yearly is the same Premium with two months free.
 *
 * Each panel is a subgrid over four shared rows (name, price, note, list),
 * so a note that wraps to two lines in one panel pushes both lists down
 * together and the lists start on the same line.
 */
export function PlanPanels({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-x-4 gap-y-4 md:grid-cols-3", className)}>
      <PlanPanel
        name="Free"
        price="$0"
        note="One card, with full tracking and every calculator."
        points={["1 saved card", "The full Tracker and every calculator", "Compare any cards in the catalog"]}
      />
      <PlanPanel
        name="Premium"
        price={`$${PREMIUM_PRICE_MONTHLY}`}
        per="a month"
        note="Every card in your wallet, tracked, and credits ticked for you."
        points={["Unlimited cards", "Auto-fill for credits you always use", "Everything in Free", "Cancel whenever you like"]}
      />
      <PlanPanel
        name="Premium yearly"
        price={`$${PREMIUM_PRICE_YEARLY}`}
        per="a year"
        note={`Two months free, against $${PREMIUM_PRICE_MONTHLY * 12} paid monthly.`}
        featured
        points={["Unlimited cards", "Auto-fill for credits you always use", "Everything in Free", "Cancel whenever you like"]}
      />
    </div>
  );
}

function PlanPanel({
  name,
  price,
  per,
  note,
  points,
  featured,
}: {
  name: string;
  price: string;
  per?: string;
  note: string;
  points: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "row-span-4 grid grid-rows-subgrid gap-y-0 rounded-widget border p-6 sm:p-7",
        featured ? "border-ink bg-surface" : "border-line bg-surface/60",
      )}
    >
      <h3 className="text-[15px] font-medium">{name}</h3>
      <p className="mt-5 font-display text-[44px] leading-none tracking-[-0.04em]">
        {price}
        {per && <span className="ml-2 text-[15px] font-normal tracking-normal text-muted">{per}</span>}
      </p>
      <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted">{note}</p>
      <ul className="mt-6 space-y-2.5 self-start border-t border-line pt-5 text-[15px]">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
