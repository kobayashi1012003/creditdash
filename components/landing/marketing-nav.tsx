"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

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
  return (
    <nav
      aria-label="Main"
      className={row ? "border-t border-line lg:hidden" : "hidden lg:block"}
    >
      <ul
        className={cn(
          "flex text-[14px]",
          row ? "mx-auto h-11 max-w-[1200px] items-center gap-6 px-4 sm:px-6" : "gap-8",
        )}
      >
        {items.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  linkClassName,
                  current ? "text-ink" : "text-muted hover:text-ink",
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
