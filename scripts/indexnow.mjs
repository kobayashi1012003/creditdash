/**
 * Tells IndexNow (Bing, Yandex, Seznam, Naver; Google does not take part)
 * that the live site's pages may have changed. Run by the ops workflow
 * after a push to main is confirmed live; can be run by hand with
 * `node scripts/indexnow.mjs`.
 *
 * Reads the URLs from the live sitemap, so it submits exactly what the
 * deploy serves. The key is the one file in public/ named <32 hex>.txt,
 * whose content is the key itself: it is public by design, and proves
 * the submitter controls the host.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SITE = process.env.SITE ?? "https://creditdash.co";
const host = new URL(SITE).host;

const keyFile = readdirSync(join(process.cwd(), "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file (public/<32 hex>.txt)");
const key = readFileSync(join(process.cwd(), "public", keyFile), "utf8").trim();

const sitemap = await fetch(`${SITE}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`sitemap.xml answered ${sitemap.status}`);
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((url) => new URL(url).host === host);
if (urlList.length === 0) throw new Error("sitemap.xml lists no URLs on this host");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
});
console.log(`IndexNow answered ${res.status} for ${urlList.length} URLs`);
// 200 accepted, 202 accepted while the key is checked. Anything else is a
// real problem (403 key not found, 422 URLs not on the host, 429 too many).
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
