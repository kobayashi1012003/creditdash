import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { Widget } from "@/components/ui/widget";
import { CALCULATORS } from "@/components/calculators/registry";
import { getWalletCards } from "@/lib/wallet";

export const metadata: Metadata = {
  title: "Calculators",
};

/**
 * Full-page versions of the same calculators the Tracker panel renders.
 * Same components, different density, so the two can never disagree.
 */
export default function CalculatorsPage() {
  const cards = getWalletCards();

  return (
    <>
      <PageHeader
        title="Calculators"
        description="Worked against the cards in your wallet, not a generic example."
      />

      <div className="space-y-5">
        {CALCULATORS.map(({ id, title, blurb, Component }) => (
          <Widget key={id} title={title} id={id} className="scroll-mt-6">
            <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-muted">
              {blurb}
            </p>
            <Component cards={cards} />
          </Widget>
        ))}
      </div>
    </>
  );
}
