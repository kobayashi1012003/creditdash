-- Tracker customisation and exact anniversary days (owner, 3 November 2026).
--
-- anniversary_day: the day of the month a card's anniversary credits reset
--   on (Venture X's travel credit renews on the exact date). Null means the
--   1st, which is how every card worked before this.
-- credit_prefs: how the user arranged this card's Tracker: credit order,
--   hidden credits, colours, and auto-fill (lib/credits/autofill.ts). The
--   app validates it on read (cleanPrefs in lib/data/schema.ts); here it is
--   only held to an object of sane size.
--
-- Both sit on user_cards, so the existing "own cards" policy covers them:
-- a user reads and writes these columns on their own rows only.
--
-- Run once in the SQL Editor of the CreditDash project
-- (wueonwuupzupptfngxou), then `npm run test:rls`.

alter table public.user_cards
  add column anniversary_day smallint
    check (anniversary_day between 1 and 31),
  add column credit_prefs jsonb not null default '{}'::jsonb
    check (jsonb_typeof(credit_prefs) = 'object' and octet_length(credit_prefs::text) <= 16384);
