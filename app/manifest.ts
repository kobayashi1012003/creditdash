import type { MetadataRoute } from "next";

/**
 * Makes the app installable. It opens on the Wallet rather than the
 * landing page, because someone who installed it already knows what it is
 * and is standing at a till. Icons come from scripts/build-icons.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CreditDash",
    short_name: "CreditDash",
    description:
      "See which card to use, what credits are left, and whether each annual fee pays for itself.",
    id: "/wallet",
    start_url: "/wallet",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // The light-theme --cd-bg. A manifest cannot follow the OS theme, and
    // the splash screen is on screen for well under a second.
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
