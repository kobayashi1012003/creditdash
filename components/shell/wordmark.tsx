import { cn } from "@/lib/cn";

/**
 * The CREDIT DASH lettering, drawn from the owner's artwork.
 *
 * The file is a mask, not a picture: black ink on transparency, with DASH
 * knocked out of its box. Painting it with `currentColor` means it follows
 * the text colour, so one file serves both themes and the dark band, and
 * the letters inside the box show whatever ground sits behind them.
 *
 * Size it by height (`h-*`); the width follows the artwork's 5.78:1 ratio.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="CreditDash"
      className={cn(
        "inline-block aspect-[1231/213] h-6 bg-current align-middle",
        // Forced colours would repaint the background to Canvas and erase it.
        "forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]",
        "[mask-image:url(/brand/wordmark.png)] [mask-size:100%_100%] [mask-repeat:no-repeat]",
        className,
      )}
    />
  );
}
