"use client";

import { ErrorState } from "@/components/shell/error-state";

/**
 * Catches anything the app shell's own boundary cannot, including a failure
 * in one of the group layouts. Below the root layout, so fonts and the theme
 * still apply.
 */
export default function RootError(props: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <ErrorState {...props} />
    </main>
  );
}
