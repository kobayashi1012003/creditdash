import type { Metadata } from "next";
import { DashboardButton } from "@/components/landing/session-buttons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Features",
  description: "What CreditDash does, in plain words: which card to use, credits left, and whether each fee pays for itself.",
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";

/**
 * One line per feature, title on the left, what it does on the right. A
 * list to read down, not a grid of identical tiles.
 */
const FEATURES: { title: string; body: string }[] = [
  {
    title: "Which card, in one tap",
    body: "Pick what you are buying, or search a store like CVS or Uber Eats, and the card that earns the most lifts out of your wallet. Ranked by what the points are worth, not just the bigger number.",
  },
  {
    title: "Credits you would forget",
    body: "Monthly, quarterly and yearly credits, ticked off as you use them. The Tracker knows whether each one resets in January or on your card anniversary, and shows what is about to expire.",
  },
  {
    title: "Is the fee worth it?",
    body: "For each card, the credits you used and what your points are worth, set against the annual fee, all year rather than once at renewal.",
  },
  {
    title: "Calculators",
    body: "Annual fee break-even, what your spend is worth on each card, and points to dollars, all using your cards and your own valuations.",
  },
  {
    title: "Compare",
    body: "Up to three cards side by side, owned or not. Every row shows which card wins.",
  },
  {
    title: "Your numbers, your valuations",
    body: "Set what a point is worth to you, and every dollar figure in the app follows it.",
  },
  {
    title: "On every device",
    body: "Sign in with Google or an emailed link and your wallet follows you. Add it to your home screen and it opens like an app.",
  },
  {
    title: "Nothing linked to your bank",
    body: "You type in the cards you own. No card numbers, no expiry dates, no logins, and no ads.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className={cn(SECTION, "pt-14 pb-10 lg:pt-20")}>
        <h1 className="max-w-[18ch] font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          Everything CreditDash does.{" "}
          <span className="text-muted">Nothing it does not need.</span>
        </h1>
      </section>

      <section className={cn(SECTION, "pb-20 lg:pb-28")}>
        <dl className="border-b border-line">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="grid gap-2 border-t border-line py-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:py-8"
            >
              <dt className="font-display text-[20px] leading-snug sm:text-[22px]">{f.title}</dt>
              <dd className="max-w-[60ch] text-[15px] leading-relaxed text-muted">{f.body}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10">
          <DashboardButton arrow />
        </div>
      </section>
    </>
  );
}
