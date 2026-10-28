"use client";

import { Widget } from "@/components/ui/widget";
import { CALCULATORS } from "@/components/calculators/registry";
import { useWallet } from "@/lib/data";

export function CalculatorsList() {
  const cards = useWallet().map((e) => e.card);

  return (
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
  );
}
