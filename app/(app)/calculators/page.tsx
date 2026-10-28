import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { CalculatorsList } from "@/components/calculators/calculators-list";

export const metadata: Metadata = {
  title: "Calculators",
};

/**
 * Full-page versions of the same calculators the Tracker panel renders.
 * Same components, different density, so the two can never disagree.
 */
export default function CalculatorsPage() {
  return (
    <>
      <PageHeader
        title="Calculators"
        description="Worked against the cards in your wallet, not a generic example."
      />
      <CalculatorsList />
    </>
  );
}
