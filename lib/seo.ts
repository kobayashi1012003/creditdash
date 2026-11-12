import type { Metadata } from "next";
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from "./plan";

/**
 * Search metadata and structured data, in one place (SEO foundation,
 * 12 November 2026). See "SEO" in CLAUDE.md for the target searches.
 *
 * The site's address lives here and nowhere else; `metadataBase` in
 * app/layout.tsx, the sitemap, robots.txt and the JSON-LD all read it.
 */
export const SITE_URL = "https://creditdash.co";
export const SITE_NAME = "CreditDash";

/** The share image, app/opengraph-image.png (`npm run og-image`). */
const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "CreditDash. Which card? Answered before you pay.",
};

type PageMeta = {
  /** The path, "/" or "/pricing". Becomes the canonical and og:url. */
  path: string;
  /** The full <title>, brand included, under about 60 characters. */
  title: string;
  /** The meta description, under about 155 characters. */
  description: string;
  /** Share title and description, when they should differ from the above. */
  social?: { title: string; description: string };
  /** false for pages that should stay out of search (sign-in, settings). */
  index?: boolean;
};

/**
 * One page's metadata: title, description, canonical, Open Graph and
 * Twitter. A page's `openGraph` replaces the root one rather than merging,
 * so this repeats siteName, type and the image every time.
 */
export function pageMetadata({ path, title, description, social, index = true }: PageMeta): Metadata {
  const share = social ?? { title, description };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: share.title,
      description: share.description,
      url: path,
      images: OG_IMAGE,
    },
    twitter: {
      card: "summary_large_image",
      title: share.title,
      description: share.description,
      images: OG_IMAGE,
    },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}

/**
 * The pages in the sitemap, most important first. A page added here must
 * also be indexable (no `index: false` in its metadata).
 */
export const SITEMAP_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/features", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  // The demo: a signed-out visitor can use all of these.
  { path: "/wallet", priority: 0.7 },
  { path: "/tracker", priority: 0.7 },
  { path: "/calculators", priority: 0.6 },
  { path: "/compare", priority: 0.6 },
  { path: "/points", priority: 0.5 },
  { path: "/about", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

/**
 * Per-card pages (`/cards/[slug]`), not built yet. When they are, set this
 * true and have the page's `generateStaticParams` return `cardPageSlugs()`,
 * so the sitemap and the pages can never list different cards.
 */
export const CARD_PAGES_LIVE = false;

/** The slug for a card's page. The card id: stored, so never renamed. */
export function cardPageSlug(card: { id: string }): string {
  return card.id;
}

// ---------------------------------------------------------------- JSON-LD

/**
 * Serialises structured data for `<script type="application/ld+json">`.
 * Inline JSON is allowed by the CSP's script-src 'unsafe-inline' (and is
 * never executed); `<` is escaped so no string can close the tag.
 */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Breadcrumbs for a page below the home page, e.g. a card page. */
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icons/icon-512.png`,
    email: "hello@creditdash.co",
  };
}

/**
 * The app and its plans, prices from lib/plan.ts. The billing period is in
 * each offer's name: Google's Rich Results Test rejects a
 * UnitPriceSpecification here ("Invalid object type for field
 * priceSpecification", 12 November 2026). No aggregateRating: there are no
 * real reviews, and Google forbids made-up ones.
 */
export function softwareApplication(description: string) {
  const premium = (name: string, price: number) => ({
    "@type": "Offer",
    name,
    price,
    priceCurrency: "USD",
  });
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description,
    offers: [
      { "@type": "Offer", name: "Free", price: 0, priceCurrency: "USD" },
      premium("Premium, monthly", PREMIUM_PRICE_MONTHLY),
      premium("Premium, yearly", PREMIUM_PRICE_YEARLY),
    ],
  };
}

/** Must match questions and answers shown on the same page, word for word. */
export function faqPage(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
