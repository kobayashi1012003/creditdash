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
          collapses and the panel renders itself as a button and a sheet. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <TrackerView />
        <div className="contents lg:block">
          <CalculatorPanel />
        </div>
      </div>
    </>
  );
}
