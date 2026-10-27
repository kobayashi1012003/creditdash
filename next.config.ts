import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cache Components is off deliberately. create-next-app turns it on, but it
   * relies on a `setTimeout()` behaviour the Workers runtime does not provide,
   * so every request hangs and returns 500 under `npm run preview`. Partial
   * Prefetching depends on it, so it is off too. Revisit if OpenNext or
   * workerd closes the gap.
   */
  cacheComponents: false,

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
