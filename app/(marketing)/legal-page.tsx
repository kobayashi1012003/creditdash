import type { ReactNode } from "react";

/**
 * Shared frame for the two legal pages. Phase 5 writes the real text; these
 * exist now so the footer does not link into a 404.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-[68ch] px-4 py-14 sm:px-6 lg:py-20">
      <h1 className="font-display text-[34px] leading-tight sm:text-[42px]">
        {title}
      </h1>
      <p className="mt-3 text-[13px] text-muted">Last updated {updated}</p>

      <div className="mt-8 rounded-inner border border-line bg-surface p-5">
        <p className="text-sm leading-relaxed">
          <strong className="font-medium">Draft, not reviewed.</strong> This is
          placeholder wording written during development. It has not been
          checked by a lawyer and does not yet bind anyone. Do not rely on it.
        </p>
      </div>

      <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-muted [&_h2]:mt-9 [&_h2]:text-[20px] [&_h2]:text-ink [&_h2]:font-display [&_h2]:leading-tight">
        {children}
      </div>
    </article>
  );
}
