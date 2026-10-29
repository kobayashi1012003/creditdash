-- CreditDash: gifted Premium.
--
-- Run once, in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Never edit this file after it has been run; add a new migration instead.
--
-- Premium the owner gives away (friends, family, testing), which nothing
-- else can take back. The database enforces it, not the app: while
-- premium_gift is true, plan is premium, whatever the Stripe webhook or
-- anything else writes.
--
-- To give it, in the SQL Editor:
--   update public.profiles set premium_gift = true
--   where user_id = (select id from auth.users where email = 'them@example.com');
-- To take it back, set premium_gift = false. Their plan then follows their
-- Stripe subscription again: Premium if they are paying, Free if not.

alter table public.profiles
  add column premium_gift boolean not null default false;

-- Users cannot write it. The first migration revoked update on profiles
-- and granted only display_name and theme back, so a new column is
-- already out of their reach; this line says so on purpose.
revoke update (premium_gift) on public.profiles from authenticated;

create function public.apply_premium_gift()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.premium_gift then
    new.plan := 'premium';
  elsif tg_op = 'UPDATE' and old.premium_gift and not new.premium_gift then
    -- Gift withdrawn: back to what Stripe says, from the rows the webhook
    -- keeps. The same statuses as lib/billing/stripe.ts.
    new.plan := case
      when exists (
        select 1 from public.subscriptions s
        where s.user_id = new.user_id
          and s.status in ('active', 'trialing', 'past_due')
      ) then 'premium'
      else 'free'
    end;
  end if;
  return new;
end;
$$;

create trigger profiles_apply_premium_gift
  before insert or update of plan, premium_gift on public.profiles
  for each row execute function public.apply_premium_gift();

revoke execute on function public.apply_premium_gift() from public, anon, authenticated;
