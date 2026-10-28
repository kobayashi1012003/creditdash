import { DEMO_WALLET } from "@/data/cards.seed";
import type { CardArt } from "@/data/card-art.generated";
import { STORAGE_KEY } from "@/lib/data/schema";

/**
 * Shows the first card in the wallet before the app has started.
 *
 * With real card art, the first card is the Wallet's largest paint, and the
 * wallet itself can only be drawn once the JavaScript has run and read
 * storage or the account: about five seconds on a throttled phone. So a
 * tiny inline script, run before anything else like the theme script, works
 * out which card is first and marks it on <html>. The loading skeleton's
 * first slot then shows that card's art from CSS alone. When the app
 * arrives it draws the same card in the same place, so nothing moves.
 *
 * It is the person's real first card, never a stand-in: from a key the
 * store keeps current in both modes, else from the stored local wallet,
 * else the demo seed a brand new browser is about to be given. A stale key
 * (another device reordered the account) shows the old first card for a
 * moment, then the real one replaces it.
 *
 * This file is not "use client": the root layout renders the script on the
 * server, and the store imports the key.
 */

/** Written by the store whenever the wallet changes: a card id, or "". */
export const FIRST_CARD_KEY = "creditdash:first-card";

/** Set on <html> by the script; the skeleton's CSS keys off it. */
export const FIRST_CARD_ATTR = "data-first-card";

const SEED_FIRST = [...DEMO_WALLET].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.cardId ?? "";

/** The URL the skeleton paints for a card: the 720 cut, else the original. */
function slotUrl(a: CardArt): string {
  const name = a.src.split("/").pop()!.replace(/\.[^.]+$/, "");
  return a.variants.includes(720) ? `/cards/w/720/${name}.webp` : a.src;
}

/**
 * The inline script. Plain ES5-ish, wrapped so it can never throw.
 *
 * Besides marking <html>, it starts the download at once with a
 * high-priority preload, from <head>, instead of leaving the browser to
 * find the URL in the skeleton's CSS halfway down the body. Only on the
 * Wallet, the one page that paints it.
 */
export function firstCardScript(art: Record<string, CardArt>): string {
  const urls = Object.fromEntries(Object.entries(art).map(([id, a]) => [id, slotUrl(a)]));
  return `try{var f=localStorage.getItem(${JSON.stringify(FIRST_CARD_KEY)});if(f===null){var r=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(r===null){f=${JSON.stringify(SEED_FIRST)}}else{var c=(JSON.parse(r).userCards||[]).slice().sort(function(a,b){return a.sortOrder-b.sortOrder})[0];f=c&&c.cardId||""}}if(f&&/^[a-z0-9-]{1,64}$/.test(f)){document.documentElement.setAttribute(${JSON.stringify(FIRST_CARD_ATTR)},f);var u=${JSON.stringify(urls)}[f];if(u&&location.pathname==="/wallet"){var l=document.createElement("link");l.rel="preload";l.as="image";l.href=u;l.setAttribute("fetchpriority","high");document.head.appendChild(l)}}}catch(e){}`;
}

/**
 * CSS that paints the art for whichever card the script marked, into any
 * element with the `.first-card-art` class. One rule per card with art, so
 * a card without art leaves the slot as a plain skeleton.
 *
 * The 720 cut covers the slot at 2x on a phone and 1x on desktop; the
 * original is the fallback for art too small to have been cut.
 */
export function firstCardCss(art: Record<string, CardArt>): string {
  return Object.entries(art)
    .map(([id, a]) => `:root[${FIRST_CARD_ATTR}="${id}"] .first-card-art{background-image:url("${slotUrl(a)}")}`)
    .join("");
}
