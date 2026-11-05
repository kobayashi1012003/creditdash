// CardAPI fetcher with a cache and a hard call budget.
//
//   node scripts/cardapi.mjs <method> [json args...]
//   node scripts/cardapi.mjs getCard '"american-express-gold-card"'
//   node scripts/cardapi.mjs getCards '{"issuer":"chase","country":"US","limit":100}'
//   node scripts/cardapi.mjs calls        (how many calls today, spends none)
//
// Every response is cached in .cardapi/raw/ (gitignored: CardAPI's terms
// forbid redistributing the data and this repository is public). A cached
// request costs nothing. Each real call is logged in .cardapi/calls.log, and
// the script refuses to call once today's count reaches CARDAPI_DAILY_BUDGET
// (default 40, well under the 100 a day the free plan allows).
//
// The key is read from CARDAPI_API_KEY in .env.local and never printed.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { CardDB, CardDBError } from "@cardapi/client";

const DIR = ".cardapi";
const RAW = join(DIR, "raw");
const LOG = join(DIR, "calls.log");
const BUDGET = Number(process.env.CARDAPI_DAILY_BUDGET ?? 40);
const ALLOWED = new Set([
  "getCard", "getCards", "searchCards", "compareCards", "getIssuers",
  "getCategories", "getRewardValuations", "getCardCredits", "getCardPerks", "getUsage",
]);

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function callsToday() {
  if (!existsSync(LOG)) return 0;
  return readFileSync(LOG, "utf8").split("\n").filter((l) => l.startsWith(today())).length;
}

function readKey() {
  if (process.env.CARDAPI_API_KEY) return process.env.CARDAPI_API_KEY;
  if (!existsSync(".env.local")) return null;
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.startsWith("CARDAPI_API_KEY="));
  return line ? line.slice("CARDAPI_API_KEY=".length).trim().replace(/^["']|["']$/g, "") : null;
}

const [method, ...rawArgs] = process.argv.slice(2);
mkdirSync(RAW, { recursive: true });

if (method === "calls") {
  console.log(`${callsToday()} of ${BUDGET} calls used today (${today()})`);
  process.exit(0);
}
if (!ALLOWED.has(method)) {
  console.error(`Unknown or disallowed method: ${method}. Allowed: ${[...ALLOWED].join(", ")}`);
  process.exit(1);
}

const args = rawArgs.map((a) => JSON.parse(a));
const id = createHash("sha1").update(JSON.stringify([method, args])).digest("hex").slice(0, 12);
const file = join(RAW, `${method}-${id}.json`);

if (existsSync(file) && method !== "getUsage") {
  console.log(`cached: ${file}`);
  process.exit(0);
}

const used = callsToday();
if (used >= BUDGET) {
  console.error(`Refusing: ${used} calls already today, budget ${BUDGET}.`);
  process.exit(2);
}

const key = readKey();
if (!key) {
  console.error("CARDAPI_API_KEY is not set in .env.local.");
  process.exit(1);
}

// No retries: a retry is another call against the quota.
const db = new CardDB({ apiKey: key, maxRetries: 0, timeoutMs: 30_000 });
appendFileSync(LOG, `${today()} ${method} ${JSON.stringify(args)}\n`);
try {
  const result = await db[method](...args);
  writeFileSync(file, JSON.stringify({ method, args, fetchedAt: new Date().toISOString(), result }, null, 1));
  console.log(`fetched: ${file} (${used + 1} of ${BUDGET} today)`);
} catch (err) {
  if (err instanceof CardDBError) {
    console.error(`CardAPI ${err.status} ${err.code}: ${err.message}${err.retryAfter ? ` (retry after ${err.retryAfter}s)` : ""}`);
  } else {
    console.error(`Request failed: ${err?.name ?? "Error"}`);
  }
  process.exit(3);
}
