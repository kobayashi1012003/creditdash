import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Everything public may be crawled, the demo included. The API, the auth
 * callback and the admin page may not. Sign-in and Settings stay crawlable
 * on purpose: they are noindex, and a crawler has to fetch a page to see
 * that.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
