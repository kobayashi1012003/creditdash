import type { ReactNode } from "react";

/**
 * Shared frame for the two legal pages. The wording is a plain-language
 * draft that describes what the app actually does today; it stays marked as
 * unreviewed until a lawyer has read it.
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
          <strong className="font-medium">Draft for legal review.</strong> This
          describes how CreditDash works today in plain language, but it has
          not yet been checked by a lawyer.
        </p>
      </div>

      <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-muted [&_h2]:mt-9 [&_h2]:text-[20px] [&_h2]:text-ink [&_h2]:font-display [&_h2]:leading-tight [&_strong]:font-medium [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
