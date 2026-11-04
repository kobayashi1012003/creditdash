import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page is prerendered at build time and nothing revalidates, so the
// prerendered copies are served from Workers static assets instead of being
// rendered again per request. Without this the default cache is a no-op:
// every visit re-rendered its page, costing 25 to 114ms of CPU against the
// free plan's 10ms, and Cloudflare answered some of them with 503
// "exceededCpu" (Workers Logs, 3 November 2026).
//
// Read-only: any future `revalidate`, `revalidatePath` or `"use cache"` needs
// a writable cache (R2 or KV) instead.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  // Serve a cache hit before Next's server code is even loaded.
  enableCacheInterception: true,
});
