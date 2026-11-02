-- Free holds one card (owner, 2 November 2026). Premium is unlimited.
-- Keep the number in step with FREE_CARD_LIMIT in lib/plan.ts.
--
-- Existing free accounts with two cards keep both rows: nothing is
-- deleted. The app shows only the first, and this trigger refuses a new
-- card while they are at or over the limit.
--
-- Run once in the SQL Editor of the CreditDash project
-- (wueonwuupzupptfngxou), then `npm run test:rls`.

create or replace function public.enforce_card_limit()
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
  -- added at the same moment cannot both see none and both pass.
  select plan into user_plan from public.profiles
    where user_id = new.user_id for update;
  if coalesce(user_plan, 'free') = 'free' then
    select count(*) into owned from public.user_cards where user_id = new.user_id;
    if owned >= 1 then
      raise exception 'The free plan holds 1 card.' using errcode = 'P0001', hint = 'card_limit';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_card_limit() from public, anon, authenticated;
