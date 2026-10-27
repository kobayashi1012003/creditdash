import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Placeholder. The landing page is built in Phase 1; this exists so the app
 * has a root while the foundation is verified.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-start justify-between gap-4">
        <p className="text-sm text-muted">CreditDash</p>
        <ThemeToggle />
      </div>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        The foundation is in place.
      </h1>
      <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-muted">
        Design tokens, both themes and the Cloudflare build are set up. Pages
        and components come next.
      </p>
      <Link
        href="/dev/tokens"
        className="mt-8 inline-flex w-fit items-center rounded-pill border border-line bg-surface px-5 py-2.5 text-sm font-medium transition-transform duration-[var(--cd-dur-press)] ease-out hover:border-muted active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        View design tokens
      </Link>
    </main>
  );
}
