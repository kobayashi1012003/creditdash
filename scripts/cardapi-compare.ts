// Lines up our catalog against cached CardAPI responses, card by card.
// Spends no calls: run scripts/cardapi.mjs first to fill .cardapi/raw/.
//
//   node scripts/cardapi-compare.ts > .cardapi/side-by-side.txt
//
// Output stays in .cardapi/ (gitignored): it quotes CardAPI's data.

import { readdirSync, readFileSync } from "node:fs";
import { CARDS } from "../data/cards.seed.ts";

/** Our id to CardAPI slug. null: CardAPI has no such card. */
export const SLUGS: Record<string, string | null> = {
  "amex-platinum": "american-express-platinum-card",
  "amex-gold": "american-express-gold-card",
  csr: "chase-sapphire-reserve-credit-card",
  csp: "chase-sapphire-preferred-credit-card",
  "venture-x": "capital-one-venture-x",
  venture: "venture-rewards-from-capital-one",
  ventureone: "capital-one-venture-one-credit-card",
  "strata-premier": "citi-strata-premier-card",
  bilt: null,
  "bilt-obsidian": null,
  "bilt-palladium": null,
  "blue-business-plus": "american-express-blue-business-plus-card",
  "hilton-surpass": "hilton-honors-surpass-card",
  "united-explorer": "united-explorer-card",
  "hilton-aspire": "hilton-honors-aspire-card",
  "hilton-honors": "hilton-honors-card",
  "marriott-bevy": null,
  "marriott-brilliant": "marriott-bonvoy-brilliant-card",
  "delta-reserve": "delta-skymiles-reserve-card",
  "delta-platinum": "delta-skymiles-platinum-card",
  "delta-gold": "delta-skymiles-gold-card",
  "delta-blue": "delta-skymiles-blue-card",
};

// Cached JSON, read only to print it. Not validated: nothing here feeds the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = Record<string, any>;
const theirs = new Map<string, Api>();
for (const f of readdirSync(".cardapi/raw").filter((x) => x.startsWith("getCards-"))) {
  const json = JSON.parse(readFileSync(`.cardapi/raw/${f}`, "utf8"));
  for (const c of json.result.data) theirs.set(c.slug, c);
}

const money = (n: unknown) => (n == null ? "?" : `$${n}`);

for (const card of CARDS) {
  const slug = SLUGS[card.id];
  console.log(`\n================ ${card.id}  (${card.name})`);
  const t = slug ? theirs.get(slug) : undefined;
  if (!t) {
    console.log(`  CardAPI: ${slug ? `slug ${slug} not returned` : "no such card"}`);
    continue;
  }
  console.log(`  CardAPI: ${t.name}  verified ${t.last_verified ?? "never"}  source ${t.source_url ?? t.tc_url ?? "-"}`);
  console.log(`  fee      ours ${money(card.annualFee)}   theirs ${money(t.annual_fee)}`);
  console.log(`  FX fee   ours ${card.foreignTransactionFee}%   theirs ${t.foreign_transaction_fee ?? "?"}%`);
  console.log(`  currency theirs ${t.reward_currency} (${t.reward_currency_name})   ours ${card.program}`);

  console.log("  RATES ours:");
  for (const r of card.earnRates)
    console.log(`    ${r.category}: ${r.multiplier}x${r.cap ? ` cap ${r.cap}` : ""}${r.boost ? `; boost ${r.boost.multiplier}x ${r.boost.where}` : ""}`);
  console.log("  RATES theirs:");
  for (const r of t.reward_rates ?? [])
    console.log(`    ${r.category_slug}: ${r.rate_multiplier}${r.rate_type === "percent_cashback" ? "%" : "x"}${r.cap_amount ? ` cap ${r.cap_amount}/${r.cap_period}` : ""}${r.booking_channel ? ` [${r.booking_channel}]` : ""}${r.merchant ? ` [${r.merchant}]` : ""}${r.notes ? `  (${r.notes})` : ""}`);

  console.log("  CREDITS ours:");
  for (const c of card.credits)
    console.log(`    ${c.id}: ${c.name} ${money(c.amount)}/${c.period} ${c.resetBasis}${c.enroll ? " enroll" : ""}${c.endsOn ? ` ends ${c.endsOn}` : ""}${c.spendToUnlock ? ` after $${c.spendToUnlock}` : ""}`);
  console.log("  CREDITS theirs:");
  for (const c of t.statement_credits ?? [])
    console.log(`    ${c.credit_name} ${money(c.credit_amount)}/${c.credit_period}${c.enrollment_required ? " enroll" : ""}${c.notes ? `  (${c.notes})` : ""}`);

  console.log("  PERKS ours:");
  for (const p of card.perks ?? []) console.log(`    ${p.kind}: ${p.name}${p.count ? ` ${p.count.perYear}/yr` : ""}`);
  if (card.anniversaryBonus) console.log(`    anniversary: ${card.anniversaryBonus.points} ${card.anniversaryBonus.unit}`);
  console.log("  PERKS theirs:");
  for (const p of t.card_perks ?? [])
    console.log(`    ${p.perk_type}: ${p.perk_name}${p.perk_value ? ` ${money(p.perk_value)}` : ""}${p.perk_period ? `/${p.perk_period}` : ""}${p.details ? `  (${p.details})` : ""}`);
  for (const b of t.benefits ?? []) console.log(`    benefit ${b.benefit_type}: ${b.name}${b.value ? ` ${money(b.value)}` : ""}`);
}
