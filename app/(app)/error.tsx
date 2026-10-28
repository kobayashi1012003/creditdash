"use client";

import { ErrorState } from "@/components/shell/error-state";

/** Inside the shell, so navigation still works while one page is broken. */
export default function AppError(props: { error: unknown; retry: () => void }) {
  return <ErrorState {...props} />;
}
