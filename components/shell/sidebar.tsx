"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/shell/wordmark";
import { ACCOUNTS_ENABLED, useAccount, useIsLoading } from "@/lib/data";

/**
 * Desktop navigation. Fixed to the left edge, narrow enough that the content
 * column keeps the full 1200px the plan asks for.
 *
 * There is no sliding active indicator. Navigation happens tens of times a
 * day, which is the tier where motion stops helping and starts costing, so
 * the active state is a background change and nothing more.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-bg px-4 py-6 lg:flex">
      {/* The logo goes to the home page, as on every site. */}
      <Link
        href="/"
        aria-label="CreditDash home"
        className="mb-8 inline-flex w-fit rounded-inner px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Wordmark className="h-[26px]" />
      </Link>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-inner px-3 py-2.5 text-[15px]",
                    "transition-[background-color,color] duration-[var(--cd-dur-hover)] ease-out",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    active
                      ? "bg-surface font-medium text-ink"
                      : "text-muted hover:bg-surface/60 hover:text-ink",
                  )}
                >
                  <Icon size={20} weight={active ? "fill" : "regular"} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <DemoBadge className="mt-auto" />
    </aside>
  );
}

/**
 * Where this wallet is saved, said plainly. A demo user should never assume
 * their data is on an account somewhere, and a signed-in one should be able
 * to see which account they are in.
 */
export function DemoBadge({ className }: { className?: string }) {
  const account = useAccount();
  const isLoading = useIsLoading();
  const box = cn("rounded-inner border border-line bg-surface px-3 py-2.5", className);

  // Same height either way, so the badge does not jump as the session loads.
  if (isLoading) return <div aria-hidden className={cn(box, "h-[58px]")} />;

  if (account) {
    return (
      <Link
        href="/settings#account"
        className={cn(
          box,
          "block transition-colors duration-[var(--cd-dur-hover)] ease-out hover:border-muted",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        <p className="truncate text-[13px] font-medium">{account.email ?? "Signed in"}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted">
          Saved to your account.
        </p>
      </Link>
    );
  }

  return (
    <div className={box}>
      <p className="text-[13px] font-medium">Demo user</p>
      <p className="mt-0.5 text-[12px] leading-snug text-muted">
        Saved in this browser only.{" "}
        {ACCOUNTS_ENABLED && (
          <Link
            href="/signin"
            className="rounded-inner text-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Sign in
          </Link>
        )}
      </p>
    </div>
  );
}
