"use client";

import { useRef, type KeyboardEvent } from "react";

/**
 * Arrow-key movement for a radio group or a tab list: the whole set is one
 * tab stop, arrows move between options and pick as they go, Home and End
 * jump to the ends, and movement wraps.
 *
 * `selected` is the index that holds the tab stop, or -1 when nothing is
 * chosen, in which case the first option holds it.
 */
export function useRovingFocus(
  count: number,
  selected: number,
  onMove: (index: number) => void,
) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const stop = selected === -1 ? 0 : selected;

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const current = refs.current.findIndex((el) => el === document.activeElement);
    if (current === -1) return;
    const last = count - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? current === last ? 0 : current + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? current === 0 ? last : current - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onMove(next);
  }

  return {
    onKeyDown,
    itemProps: (index: number) => ({
      ref: (el: HTMLElement | null) => {
        refs.current[index] = el;
      },
      tabIndex: index === stop ? 0 : -1,
    }),
  };
}
