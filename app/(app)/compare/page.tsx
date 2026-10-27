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
        description="Two or three cards, side by side, with the winner of each row tinted."
      />
      <CompareView all={CARDS} />
    </>
  );
}
