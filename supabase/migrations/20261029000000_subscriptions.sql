-- CreditDash: Phase 7, Stripe subscriptions.
--
-- Run once, in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Never edit this file after it has been run; add a new migration instead.
--
-- Only the server writes here, using the secret key from the Stripe
-- webhook (app/api/billing/webhook). Users can read their own rows, which
-- is how Settings shows when Premium renews or ends, and nothing else.

create table public.subscriptions (
  stripe_subscription_id text primary key check (char_length(stripe_subscription_id) between 1 and 255),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (char_length(status) between 1 and 32),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

-- One Stripe customer belongs to one user, and the webhook finds the user
-- by it, so a duplicate would hand one person's plan to another.
create unique index profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.subscriptions enable row level security;

create policy "Own subscriptions: read" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();
