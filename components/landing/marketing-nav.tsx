"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useSignedIn } from "@/components/landing/session-buttons";

/**
 * The public pages' tabs, with the current page marked. Inline in the
 * header from laptop width; below that, a slim row of its own under the
 * header bar, since the bar has room for the logo and buttons only.
 */
export function MarketingNav({
  items,
  linkClassName,
  row = false,
}: {
  items: { href: string; label: string }[];
  linkClassName: string;
  /** The phone and tablet version, a row under the bar. */
  row?: boolean;
}) {
  const pathname = usePathname();
  // Dashboard sends visitors to sign-in first, like the buttons do.
  const signedIn = useSignedIn();
  return (
    <nav
      aria-label="Main"
      className={row ? "border-t border-line lg:hidden" : "hidden lg:block"}
    >
      <ul
        className={cn(
          "flex text-[14px]",
          row ? "mx-auto h-11 max-w-[1200px] items-center gap-4 px-4 sm:gap-6 sm:px-6" : "gap-8",
        )}
      >
        {items.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href === "/wallet" && !signedIn ? "/signin" : href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  linkClassName,
                  // Bold ink for every tab (owner, 2 November 2026); the
                  // current page is underlined.
                  "font-semibold text-ink decoration-2 underline-offset-[6px] hover:underline",
                  // A 44px-tall tap area without moving the text: the row
                  // is 44px, the label 18px.
                  "relative after:absolute after:-inset-x-2 after:-inset-y-[13px] after:content-['']",
                  current && "underline",
                  "focus-visible:outline-focus",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
