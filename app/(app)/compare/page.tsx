import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { CompareView } from "@/components/compare/compare-view";
import { CARDS } from "@/data/cards.seed";

export const metadata: Metadata = {
  title: "Compare",
};

export default function ComparePage() {
  return (
    <>
      <PageHeader
        title="Compare"
        description="Pick up to 3 cards to see side by side. The winner of each row is tinted."
      />
      <CompareView all={CARDS} />
    </>
  );
}
