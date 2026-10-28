import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { TrackerView } from "@/components/tracker/tracker-view";
import { CalculatorPanel } from "@/components/calculators/calculator-panel";

export const metadata: Metadata = {
  title: "Tracker",
};

export default function TrackerPage() {
  return (
    <>
      <PageHeader
        title="Tracker"
        description="What each card gives back, and how much of it you have taken."
      />

      {/* The panel gets its own grid column so it can stick against a
          scrolling Tracker rather than float over it. On mobile the grid
          collapses and the panel renders itself as a button and a sheet.

          The grid must stretch, not start-align: a sticky element can only
          travel inside its containing block, so a wrapper collapsed to the
          panel's own height leaves it nothing to stick within and it scrolls
          away with the page. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <TrackerView />
        <div className="contents lg:block lg:h-full">
          <CalculatorPanel />
        </div>
      </div>
    </>
  );
}
