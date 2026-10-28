/**
 * Proves Row Level Security against the real Supabase project: two
 * throwaway users, every way one could reach the other's data, and the free
 * card limit. Exits non-zero on any failure, and deletes both users (and by
 * cascade every row they made) whether it passes or not.
 *
 *   npm run test:rls
 *
 * Needs SUPABASE_SECRET_KEY in .env.local, only to create and delete the two
 * test users. Every check itself runs as a signed-in user with the
 * publishable key, exactly as the browser does, so nothing here is proven
 * by the secret key's ability to bypass RLS.
 *
 * Not part of `npm test`: it talks to the network and needs a secret.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local.",
  );
  process.exit(2);
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secret, noSession);

let failures = 0;
function expect(ok, label, detail) {
  console.log(`${ok ? "pass" : "FAIL"}  ${label}${!ok && detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

async function makeUser(tag) {
  const email = `rls-${tag}-${randomBytes(4).toString("hex")}@creditdash.test`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`create ${tag}: ${error.message}`);
  const client = createClient(url, publishable, noSession);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`sign in ${tag}: ${signIn.error.message}`);
  return { id: data.user.id, db: client };
}

const users = [];
try {
  const a = await makeUser("a");
  users.push(a);
  const b = await makeUser("b");
  users.push(b);

  // --- A writes one row in every table ------------------------------------
  const card = await a.db
    .from("user_cards")
    .insert({ user_id: a.id, card_id: "amex-gold", anniversary_month: 3 })
    .select("id")
    .single();
  expect(!card.error, "A can add a card", card.error?.message);
  const cardId = card.data?.id;

  const usage = await a.db.from("credit_usage").insert({
    user_id: a.id,
    user_card_id: cardId,
    credit_id: "gold-dining",
    period_key: "2026-10",
    amount_used: 10,
  });
  expect(!usage.error, "A can record credit usage", usage.error?.message);

  const bal = await a.db.from("point_balances").insert({ user_id: a.id, program: "amex-mr", balance: 1000 });
  expect(!bal.error, "A can save a points balance", bal.error?.message);
  const val = await a.db.from("valuations").insert({ user_id: a.id, program: "amex-mr", cents_per_point: 2 });
  expect(!val.error, "A can save a valuation", val.error?.message);

  const ownProfile = await a.db.from("profiles").select("plan").eq("user_id", a.id).single();
  expect(ownProfile.data?.plan === "free", "A has a profile, created at sign-up, on the free plan", ownProfile.error?.message);

  // --- B cannot read any of it --------------------------------------------
  for (const table of ["user_cards", "credit_usage", "point_balances", "valuations", "profiles"]) {
    const res = await b.db.from(table).select("*").eq("user_id", a.id);
    expect(!res.error && res.data.length === 0, `B reads none of A's ${table}`, res.error?.message ?? `${res.data?.length} rows`);
  }

  // --- B cannot change or delete it ---------------------------------------
  const upd = await b.db.from("user_cards").update({ nickname: "mine now" }).eq("id", cardId).select();
  expect(!upd.error && upd.data.length === 0, "B cannot rename A's card", upd.error?.message ?? `${upd.data?.length} rows changed`);

  const del = await b.db.from("user_cards").delete().eq("id", cardId).select();
  expect(!del.error && del.data.length === 0, "B cannot delete A's card", del.error?.message ?? `${del.data?.length} rows deleted`);

  const delUsage = await b.db.from("credit_usage").delete().eq("user_id", a.id).select();
  expect(!delUsage.error && delUsage.data.length === 0, "B cannot delete A's credit usage", delUsage.error?.message);

  // --- B cannot write into A's space --------------------------------------
  const forged = await b.db.from("user_cards").insert({ user_id: a.id, card_id: "csr", anniversary_month: 1 });
  expect(Boolean(forged.error), "B cannot add a card to A's wallet");

  const attached = await b.db.from("credit_usage").insert({
    user_id: b.id,
    user_card_id: cardId,
    credit_id: "gold-dining",
    period_key: "2026-11",
    amount_used: 5,
  });
  expect(Boolean(attached.error), "B cannot attach usage to A's card");

  // --- nobody can change their own plan -----------------------------------
  const promote = await b.db.from("profiles").update({ plan: "premium" }).eq("user_id", b.id);
  expect(Boolean(promote.error), "B cannot make themselves Premium");
  const admin_ = await b.db.from("profiles").update({ is_admin: true }).eq("user_id", b.id);
  expect(Boolean(admin_.error), "B cannot make themselves an admin");
  const rename = await b.db.from("profiles").update({ display_name: "B" }).eq("user_id", b.id).select();
  expect(!rename.error && rename.data.length === 1, "B can still change their own display name", rename.error?.message);

  // --- signed out sees nothing --------------------------------------------
  const anon = createClient(url, publishable, noSession);
  const anonRead = await anon.from("user_cards").select("*");
  expect(Boolean(anonRead.error) || anonRead.data.length === 0, "A signed-out visitor reads no cards");

  // --- the free limit holds in the database -------------------------------
  const second = await a.db.from("user_cards").insert({ user_id: a.id, card_id: "csr", anniversary_month: 1 });
  expect(!second.error, "A can add a second card on the free plan", second.error?.message);
  const third = await a.db.from("user_cards").insert({ user_id: a.id, card_id: "bilt", anniversary_month: 1 });
  expect(third.error?.hint === "card_limit", "A cannot add a third card on the free plan", third.error?.message ?? "insert succeeded");

  // --- A still has everything B tried to touch ----------------------------
  const intact = await a.db.from("user_cards").select("nickname").eq("id", cardId).single();
  expect(intact.data && intact.data.nickname === null, "A's card is untouched after B's attempts");
} catch (e) {
  console.error(e);
  failures++;
} finally {
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`cleanup: could not delete test user ${u.id}: ${error.message}`);
  }
  if (users.length) {
    const left = await admin.from("user_cards").select("id").in("user_id", users.map((u) => u.id));
    expect(!left.error && left.data.length === 0, "Deleting a user deletes all of their rows", left.error?.message);
  }
}

console.log(failures === 0 ? "\nAll RLS checks passed." : `\n${failures} check(s) failed.`);
// exitCode, not process.exit(): exiting while fetch sockets are still
// closing trips a libuv assertion on Windows.
process.exitCode = failures === 0 ? 0 : 1;
