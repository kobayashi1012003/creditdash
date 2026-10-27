import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { Widget } from "@/components/ui/widget";
import { EarnChip } from "@/components/ui/earn-chip";
import { CATEGORIES, CATEGORY_LABELS, categoryStyle } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Tokens",
  robots: { index: false, follow: false },
};

const PASTELS = ["mint", "lavender", "peach", "sky", "butter"] as const;

const RADII = [
  { name: "widget", value: "24px", use: "Panels and cards" },
  { name: "inner", value: "16px", use: "Controls and inner surfaces" },
  { name: "pill", value: "999px", use: "Chips and category buttons" },
] as const;

const DURATIONS = [
  { token: "press", value: "140ms", use: "Button press feedback" },
  { token: "hover", value: "180ms", use: "Hover and colour change" },
  { token: "pop", value: "200ms", use: "Tooltips and small popovers" },
  { token: "menu", value: "220ms", use: "Dropdowns and selects" },
  { token: "panel", value: "280ms", use: "Drawers and the calculator panel" },
] as const;

/**
 * Phase 0 verification surface. It renders every token so the theme can be
 * checked in both modes at any width. Phase 1 deletes this route once the
 * real components replace it.
 */
export default function TokensPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">
            Design tokens
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted">
            Every value the interface is allowed to use. Nothing outside{" "}
            <code className="rounded-[6px] bg-surface px-1.5 py-0.5 text-[13px]">
              app/globals.css
            </code>{" "}
            hardcodes a colour, radius, duration or curve.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Widget title="Earn chips" className="lg:col-span-2">
          <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-muted">
            A category owns one pastel and keeps it on every screen. Eight
            categories share five pastels along family lines, and everything
            else stays uncoloured so the coloured ones keep their meaning.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category, i) => (
              <EarnChip
                key={category}
                category={category}
                multiplier={[4, 4, 3, 3, 2, 2, 2, 1][i]}
              />
            ))}
          </div>
        </Widget>

        <Widget title="Surfaces">
          <dl className="divide-y divide-line text-sm">
            {[
              ["Background", "--cd-bg"],
              ["Surface", "--cd-surface"],
              ["Text primary", "--cd-text"],
              ["Text secondary", "--cd-text-muted"],
              ["Border", "--cd-border"],
            ].map(([label, token]) => (
              <div
                key={token}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <dt>{label}</dt>
                <dd className="flex items-center gap-3">
                  <code className="text-[13px] text-muted">{token}</code>
                  <span
                    aria-hidden
                    className="size-6 rounded-[8px] border border-line"
                    style={{ backgroundColor: `var(${token})` }}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </Widget>

        <Widget title="Pastels">
          <div className="grid grid-cols-5 gap-2">
            {PASTELS.map((p) => (
              <div key={p} className="text-center">
                <div
                  className="grid h-16 place-items-center rounded-inner text-sm font-medium"
                  style={{
                    backgroundColor: `var(--cd-${p})`,
                    color: `var(--cd-${p}-ink)`,
                  }}
                >
                  Aa
                </div>
                <p className="mt-2 text-[13px] text-muted">{p}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Every pastel and ink pairing clears WCAG AA in both themes.
          </p>
        </Widget>

        <Widget title="Type scale">
          <div className="space-y-4">
            <p className="font-display text-5xl leading-none">
              Display, Newsreader
            </p>
            <p className="font-display text-2xl leading-tight">
              Section heading
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              Body copy is Geist at 15px with relaxed leading, held under 65
              characters per line so it stays readable.
            </p>
            <p className="text-3xl">142,000 points, $1,704 at 1.2 cents</p>
            <p className="text-sm text-muted">
              Numbers are tabular by default, so balances line up in a column.
            </p>
          </div>
        </Widget>

        <Widget title="Radius">
          <dl className="divide-y divide-line text-sm">
            {RADII.map(({ name, value, use }) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <dt className="font-medium">{use}</dt>
                  <dd className="text-[13px] text-muted">
                    rounded-{name}, {value}
                  </dd>
                </div>
                <span
                  aria-hidden
                  className="size-10 shrink-0 border border-line bg-bg"
                  style={{ borderRadius: `var(--cd-radius-${name})` }}
                />
              </div>
            ))}
          </dl>
        </Widget>

        <Widget title="Motion" className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">Duration</h3>
              <dl className="divide-y divide-line text-sm">
                {DURATIONS.map(({ token, value, use }) => (
                  <div
                    key={token}
                    className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <dt className="text-muted">{use}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Easing</h3>
              <dl className="divide-y divide-line text-sm">
                {[
                  ["Entering and exiting", "ease-out"],
                  ["Moving on screen", "ease-in-out"],
                  ["Drawers and sheets", "ease-drawer"],
                ].map(([use, token]) => (
                  <div
                    key={token}
                    className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <dt className="text-muted">{use}</dt>
                    <dd>
                      <code className="text-[13px]">{token}</code>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                ease-in is never used. It delays the first frame, which is the
                moment the user is watching most closely.
              </p>
            </div>
          </div>
        </Widget>

        <Widget title="Category reference" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                style={categoryStyle(category)}
                className="rounded-inner border border-transparent p-4 text-sm font-medium data-[plain]:border-line"
                data-plain={category === "other" ? "" : undefined}
              >
                {CATEGORY_LABELS[category]}
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </main>
  );
}
