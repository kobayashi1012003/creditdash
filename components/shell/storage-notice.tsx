"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useNotice } from "@/lib/data";

/**
 * Inline, at the top of the content column, and only when saving has
 * actually failed: this browser refusing to store anything, or the account
 * refusing or missing a change. Not dismissible: the condition is still true
 * after a dismissal, and the user would find out the hard way on reload.
 * A later successful save clears it.
 */
export function StorageNotice() {
  const notice = useNotice();
  if (!notice) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-inner bg-butter px-4 py-3 text-butter-ink"
    >
      <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
      <p className="text-sm leading-relaxed">{notice.message}</p>
    </div>
  );
}
