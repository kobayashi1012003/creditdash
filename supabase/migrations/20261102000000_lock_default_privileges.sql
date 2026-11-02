-- Security review, 2 November 2026.
--
-- Supabase grants every new table and function in `public` to `anon` and
-- `authenticated` by default. Each migration so far revoked those grants by
-- hand; this makes "nothing" the default, so a table added later (from a
-- migration or the dashboard) is closed until a migration opens it on
-- purpose. Existing grants and policies are untouched.
--
-- Run once in the SQL Editor of the CreditDash project
-- (wueonwuupzupptfngxou), then `npm run test:rls`.

-- Future tables, sequences and functions created by the role running this
-- (postgres, which is what the SQL Editor uses).
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;

-- Table privileges PostgREST never uses. Defence in depth only.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Afterwards, this should list every public table with rls = true:
--
--   select c.relname, c.relrowsecurity as rls
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm');
