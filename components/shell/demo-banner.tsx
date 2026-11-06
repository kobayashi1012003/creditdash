"use client";

import Link from "next/link";
import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { closeDemoBanner } from "@/lib/demo-banner";
import { Button } from "@/components/ui/button";

/**
 * Tells someone using the demo that nothing is saved to an account, and
 * offers a free one. Visible only under <html data-demo>, which the <head>
 * script sets for visitors without a session who have not closed it (see
 * lib/demo-banner.ts). Closing it lasts for this visit only.
 */
export function DemoBanner() {
  return (
    <div
      role="region"
      aria-label="Demo notice"
      className="hidden border-b border-butter-ink/15 bg-butter text-butter-ink in-data-demo:block"
    >
      <div className="mx-auto flex max-w-[1200px] items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6 lg:px-10">
        <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 sm:mt-0" />
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed sm:text-sm">
          <span className="font-medium">This is the demo, and nothing is saved to an account.</span>{" "}
          Create a free account to keep your wallet and Tracker on every device.
        </p>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/signin" />}
          className="shrink-0 bg-butter-ink text-butter hover:bg-butter-ink/90 max-sm:hidden"
        >
          Create a free account
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={closeDemoBanner}
          aria-label="Close the demo notice"
          className="shrink-0 text-butter-ink hover:bg-butter-ink/10"
        >
          <XIcon size={16} />
        </Button>
      </div>
      <div className="px-4 pb-2.5 sm:hidden">
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/signin" />}
          className="w-full bg-butter-ink text-butter hover:bg-butter-ink/90"
        >
          Create a free account
        </Button>
      </div>
    </div>
  );
}
