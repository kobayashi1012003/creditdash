"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useIsUnsaved } from "@/lib/data";

/**
 * Inline, at the top of the content column, and only when saving has
 * actually failed. Not dismissible: the condition is still true after a
 * dismissal, and the user would find out the hard way on the next reload.
 */
export function StorageNotice() {
  const unsaved = useIsUnsaved();
  if (!unsaved) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-inner bg-butter px-4 py-3 text-butter-ink"
    >
      <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
      <p className="text-sm leading-relaxed">
        <span className="font-medium">This browser is not saving your changes.</span>{" "}
        They will be lost when you close or reload the page. Private browsing
        or blocked site data usually causes this; allow site data for
        CreditDash and reload to fix it.
      </p>
    </div>
  );
}
