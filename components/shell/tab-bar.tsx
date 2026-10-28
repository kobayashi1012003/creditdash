"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * Mobile navigation. Sits in the safe area at the bottom, where a thumb
 * reaches, because the core job happens at a checkout on a phone.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            // min-w-0 matters: without it a flex item refuses to shrink
            // below its label, and five labels need more than a 375px phone
            // has, pushing the whole page sideways.
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 min-w-0 flex-col items-center justify-center gap-1 px-1",
                  "transition-[color,transform] duration-[var(--cd-dur-press)] ease-out",
                  "active:scale-[0.94]",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon size={21} weight={active ? "fill" : "regular"} />
                <span className="w-full truncate text-center text-[10.5px] leading-none tracking-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
