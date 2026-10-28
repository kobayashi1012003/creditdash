"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, MonitorIcon, SunIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useRovingFocus } from "@/lib/use-roving-focus";

const subscribe = () => () => {};

const OPTIONS = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const;

/**
 * Three-state segmented control. System is a real choice, not a hidden
 * default, so it gets its own segment rather than being inferred.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // The server cannot know the stored theme, so the active segment is only
  // painted on the client. useSyncExternalStore gives false during SSR and
  // true after, with no state write in an effect. The control renders at full
  // size either way, so nothing shifts.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const { onKeyDown, itemProps } = useRovingFocus(
    OPTIONS.length,
    mounted ? OPTIONS.findIndex((o) => o.value === theme) : -1,
    (i) => setTheme(OPTIONS[i].value),
  );

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      onKeyDown={onKeyDown}
      className="inline-flex items-center gap-0.5 rounded-pill border border-line bg-surface p-1"
    >
      {OPTIONS.map(({ value, label, Icon }, i) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid size-8 place-items-center rounded-pill",
              "transition-[background-color,color,transform] duration-[var(--cd-dur-press)] ease-out",
              "active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              active
                ? "bg-bg text-ink"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} />
          </button>
        );
      })}
    </div>
  );
}
