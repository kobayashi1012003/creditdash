import type { NextConfig } from "next";

/**
 * Security headers on every response (security review, 2 November 2026).
 *
 * The CSP allows inline scripts because the first-card script and Next's
 * own bootstrap are inline; a nonce would need a proxy, which OpenNext
 * cannot run yet. Everything else is locked to this origin plus Supabase.
 * When Google Identity Services ships, add https://accounts.google.com to
 * script-src, connect-src and frame-src.
 */
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_WS = SUPABASE.replace(/^https:/, "wss:");

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /**
   * Cache Components is off deliberately. create-next-app turns it on, but it
   * relies on a `setTimeout()` behaviour the Workers runtime does not provide,
   * so every request hangs and returns 500 under `npm run preview`. Partial
   * Prefetching depends on it, so it is off too. Revisit if OpenNext or
   * workerd closes the gap.
   */
  cacheComponents: false,

  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
