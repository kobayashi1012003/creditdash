-- CreditDash: first schema. The tables from creditdash-plan.md section 6
-- that hold a user's own data, with Row Level Security on every one.
--
-- Run once, in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Never edit this file after it has been run; add a new migration instead.
--
-- Not here on purpose:
-- - The card catalog (cards, card_earn_rates, card_credits). It stays in
--   data/cards.seed.ts until Phase 8 decides where real card data comes
--   from, so card_id and credit_id below are the seed's text ids, not
--   foreign keys.
-- - subscriptions. Phase 7, with Stripe.
--
-- Nothing in any table is a card number, expiry date, CVV or bank login,
-- and no column exists that could hold one.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created automatically at sign-up.
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  -- Set only by the server (Phase 7's Stripe webhook). Users cannot write
  -- it: see the column grants below.
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_cards: the cards a user says they own.
-- ---------------------------------------------------------------------------

create table public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null check (char_length(card_id) between 1 and 64),
  nickname text check (char_length(nickname) <= 40),
  opened_on date not null default current_date,
  anniversary_month smallint not null check (anniversary_month between 1 and 12),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create index user_cards_user_id_idx on public.user_cards (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- credit_usage: how much of each credit is used, per period.
-- period_key comes from lib/credits/reset.ts ("2026-Q2", "a2025-11:Q2").
-- Removing a card removes its usage with it.
-- ---------------------------------------------------------------------------

create table public.credit_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_card_id uuid not null references public.user_cards (id) on delete cascade,
  credit_id text not null check (char_length(credit_id) between 1 and 64),
  period_key text not null check (char_length(period_key) between 1 and 32),
  amount_used numeric(10, 2) not null check (amount_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_card_id, credit_id, period_key)
);

create index credit_usage_user_id_idx on public.credit_usage (user_id);

-- ---------------------------------------------------------------------------
-- point_balances and valuations: one row per user per points program.
-- ---------------------------------------------------------------------------

create table public.point_balances (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  program text not null check (char_length(program) between 1 and 32),
  balance bigint not null check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, program)
);

create table public.valuations (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  program text not null check (char_length(program) between 1 and 32),
  cents_per_point numeric(6, 3) not null check (cents_per_point > 0 and cents_per_point < 100),
  primary key (user_id, program)
);

-- ---------------------------------------------------------------------------
-- Row Level Security. Every table: a signed-in user reaches only rows whose
-- user_id is their own. (select auth.uid()) rather than auth.uid() lets
-- Postgres evaluate it once per query instead of once per row.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_cards enable row level security;
alter table public.credit_usage enable row level security;
alter table public.point_balances enable row level security;
alter table public.valuations enable row level security;

create policy "Own profile: read" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Own profile: update" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own cards" on public.user_cards
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The card a usage row points at must belong to the same user, or someone
-- could attach rows to another person's card id.
create policy "Own credit usage" on public.credit_usage
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_cards c
      where c.id = user_card_id and c.user_id = (select auth.uid())
    )
  );

create policy "Own point balances" on public.point_balances
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own valuations" on public.valuations
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Signed-out visitors (the anon role) get nothing at all, even before RLS.
revoke all on public.profiles, public.user_cards, public.credit_usage,
  public.point_balances, public.valuations from anon;

-- Profiles: users may change their name and theme, never their plan,
-- Stripe id or admin flag. Inserts come only from the sign-up trigger.
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, theme) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- A profile for every new user, so the app never has to create one.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The free card limit, enforced in the database so it holds whatever the
-- browser sends. Keep the number in step with FREE_CARD_LIMIT in
-- lib/plan.ts. Premium is set only by the server, so a user cannot lift
-- their own limit.
create function public.enforce_card_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_plan text;
  owned integer;
begin
  -- Locking the profile row serialises this user's inserts, so two cards
  -- added at the same moment cannot both see one card and both pass.
  select plan into user_plan from public.profiles
    where user_id = new.user_id for update;
  if coalesce(user_plan, 'free') = 'free' then
    select count(*) into owned from public.user_cards where user_id = new.user_id;
    if owned >= 2 then
      raise exception 'The free plan holds 2 cards.' using errcode = 'P0001', hint = 'card_limit';
    end if;
  end if;
  return new;
end;
$$;

create trigger user_cards_enforce_limit
  before insert on public.user_cards
  for each row execute function public.enforce_card_limit();

-- updated_at that the browser cannot forget or fake.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger credit_usage_touch before update on public.credit_usage
  for each row execute function public.touch_updated_at();
create trigger point_balances_touch before update on public.point_balances
  for each row execute function public.touch_updated_at();

-- Trigger functions are not meant to be called directly through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_card_limit() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
