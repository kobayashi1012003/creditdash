import type { MetadataRoute } from "next";
import { CARDS } from "@/data/cards.seed";
import { CARD_PAGES_LIVE, SITEMAP_PAGES, SITE_URL, cardPageSlug } from "@/lib/seo";

/**
 * Every public, indexable page: the marketing pages and the demo. Sign-in,
 * Settings and /admin are noindex and left out. Card pages join by
 * themselves once CARD_PAGES_LIVE is true (lib/seo.ts). Static: Next
 * renders this once at build.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = SITEMAP_PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, priority }));
  const cards = CARD_PAGES_LIVE
    ? CARDS.map((card) => ({ url: `${SITE_URL}/cards/${cardPageSlug(card)}`, priority: 0.6 }))
    : [];
  return [...pages, ...cards];
}
