import type { MetadataRoute } from "next";

/**
 * The public pages. The app's own pages are left out and marked noindex
 * in app/(app)/layout.tsx. Static: Next renders this once at build.
 */
const SITE = "https://creditdash.co";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/features", priority: 0.8 },
  { path: "/pricing", priority: 0.8 },
  { path: "/about", priority: 0.5 },
  { path: "/signin", priority: 0.4 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({ url: `${SITE}${path}`, priority }));
}
