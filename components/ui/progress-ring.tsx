import { cn } from "@/lib/cn";

type ProgressRingProps = {
  /** 0 to 1. Values outside the range are clamped. */
  value: number;
  size?: number;
  /** Stroke width in pixels. */
  thickness?: number;
  /** Shown inside the ring. Keep it to a few characters. */
  label?: string;
  sublabel?: string;
  /** A category pastel ink, e.g. `var(--cd-cat-dining-ink)`. */
  tint?: string;
  className?: string;
};

/**
 * Credits used against credits available.
 *
 * The arc does not animate on mount. This is a number the user is reading,
 * not a state change they caused, and motion on load would make the figure
 * harder to read rather than easier. It transitions only when the value
 * itself changes, which is Phase 3.
 */
export function ProgressRing({
  value,
  size = 112,
  thickness = 9,
  label,
  sublabel,
  tint = "var(--cd-text)",
  className,
}: ProgressRingProps) {
  const pct = Math.min(1, Math.max(0, value));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct * 100)} percent${label ? `, ${label}` : ""}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cd-border)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tint}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-[var(--cd-dur-panel)] ease-out"
        />
      </svg>

      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          {label && (
            <span className="text-xl leading-none font-medium">{label}</span>
          )}
          {sublabel && (
            <span className="text-[11px] leading-none text-muted">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
