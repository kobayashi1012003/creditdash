import type { MetadataRoute } from "next";

/** Everything public may be crawled; the admin page and the API may not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: "https://creditdash.co/sitemap.xml",
  };
}
