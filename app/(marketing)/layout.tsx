import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { Wordmark } from "@/components/shell/wordmark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkipLink } from "@/components/shell/skip-link";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#which-card", label: "Which card" },
  { href: "/#credits", label: "Credits" },
  { href: "/#fees", label: "Annual fees" },
  { href: "/#pricing", label: "Pricing" },
];

const FOOTER = [
  {
    title: "Product",
    links: [
      { href: "/wallet", label: "Wallet" },
      { href: "/tracker", label: "Tracker" },
      { href: "/calculators", label: "Calculators" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signin", label: "Sign in" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "mailto:hello@creditdash.co", label: "hello@creditdash.co" },
    ],
  },
];

const LINK =
  "rounded-control underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-4";

/**
 * Public pages. No sidebar, no tab bar. Geist Mono loads here only, for the
 * measurements and axis labels on these pages, so the app never pays for it.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={cn(GeistMono.variable, "flex min-h-full flex-col")}>
      <SkipLink />
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="shrink-0 rounded-control text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <Wordmark className="h-[26px] sm:h-8" />
          </Link>
          <nav aria-label="Sections" className="hidden lg:block">
            <ul className="flex gap-8 text-[14px]">
              {NAV.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={cn(LINK, "text-muted hover:text-ink focus-visible:outline-focus")}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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

      <footer className="bg-band text-band-ink">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-14 pb-10 sm:px-6 lg:px-10">
          <div className="grid gap-10 border-t border-band-line pt-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <Wordmark className="h-10 sm:h-12" />
              <p className="mt-5 max-w-[42ch] text-[13px] leading-relaxed text-band-muted">
                Not financial advice. Card details are sample data and can be
                wrong. Check anything that matters with your issuer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {FOOTER.map((group) => (
                <nav key={group.title} aria-label={group.title}>
                  <p className="text-[13px] font-medium">{group.title}</p>
                  <ul className="mt-4 space-y-2.5 text-[13px]">
                    {group.links.map(({ href, label }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          className={cn(LINK, "text-band-muted hover:text-band-ink focus-visible:outline-band-ink")}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
          <p className="mt-14 text-[13px] text-band-muted">
            CreditDash. No ads, no bank links.
          </p>
        </div>
      </footer>
    </div>
  );
}
