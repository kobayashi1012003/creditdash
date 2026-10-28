/**
 * First thing in the tab order on every page. Off screen until focused, so
 * a keyboard user can pass the navigation in one key press and nobody else
 * ever sees it.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-50 -translate-y-[200%] rounded-pill bg-ink px-4 py-2.5 text-sm font-medium text-bg opacity-0 transition-[transform,opacity] duration-[var(--cd-dur-pop)] ease-out focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Skip to content
    </a>
  );
}
