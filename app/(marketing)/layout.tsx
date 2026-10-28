import Link from "next/link";
import { Wordmark } from "@/components/shell/wordmark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkipLink } from "@/components/shell/skip-link";

/** Public pages. No sidebar, no tab bar. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <SkipLink />
      {/* One line, 68px tall, everything fits at lg. */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="rounded-inner focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/signin" />}
              className="hidden sm:inline-flex"
            >
              Sign in
            </Button>
            <Button size="sm" nativeButton={false} render={<Link href="/wallet" />}>
              Open the demo
            </Button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-8 gap-y-5 px-4 py-10 sm:px-6 lg:px-10">
          <div>
            <Wordmark className="text-[18px]" />
            <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">
              Not financial advice. Card details are sample data and can be
              wrong. Check anything that matters with your issuer.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
              {[
                { href: "/signin", label: "Sign in" },
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-inner text-muted underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
