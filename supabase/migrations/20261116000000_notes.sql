-- Notes (owner, 16 November 2026). Premium.
--
-- One general note per user, and one note per credit on a card in the
-- wallet. note_key is 'general', or '<card id>:<credit id>' with the card's
-- row in user_card_id, so removing the card removes its notes, as it does
-- its credit usage.
--
-- Premium is enforced here, not only in the app: writing a note needs
-- profiles.plan = 'premium' (gifted Premium included, since the gift holds
-- plan at premium). Reading and deleting do not, so someone back on Free
-- still sees, and can clear, what they wrote.
--
-- Run once in the SQL Editor of the CreditDash project
-- (wueonwuupzupptfngxou), then `npm run test:rls`.

create table public.notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  note_key text not null check (char_length(note_key) between 1 and 140),
  user_card_id uuid references public.user_cards (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, note_key),
  -- The general note has no card; every other note has one.
  check ((note_key = 'general') = (user_card_id is null))
);

create index notes_user_card_id_idx on public.notes (user_card_id);

alter table public.notes enable row level security;

create policy "Own notes: read" on public.notes
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Own notes: delete" on public.notes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Writing: your own row, on Premium, and a card that is yours.
create policy "Own notes: add" on public.notes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.plan = 'premium'
    )
    and (
      user_card_id is null
      or exists (
        select 1 from public.user_cards c
        where c.id = user_card_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy "Own notes: change" on public.notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid()) and p.plan = 'premium'
    )
    and (
      user_card_id is null
      or exists (
        select 1 from public.user_cards c
        where c.id = user_card_id and c.user_id = (select auth.uid())
      )
    )
  );

revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_updated_at();

-- Afterwards this should show rls = true:
--
--   select relname, relrowsecurity as rls from pg_class where relname = 'notes';
