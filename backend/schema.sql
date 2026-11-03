-- Grade 3 Maths: database for parent accounts and cloud sync (Supabase).
--
-- How to use: open your Supabase project, go to "SQL Editor", paste this whole file
-- and press "Run". It is safe to run again later (for example after an update): it
-- only creates what is missing and refreshes the rules and functions.
--
-- What it stores (and nothing else):
--   parents   one row per signed-in parent: which privacy policy version they agreed to, and when.
--             (The parent's email lives in Supabase's own auth.users table, not here.)
--   children  each child profile: a nickname and an emoji avatar. No email, no birthday, no photo.
--   progress  one row per child per activity: stars, plays, answers and mistake counts.
--
-- Who can see what: row level security (RLS) is switched on for every table, so a signed-in
-- parent can only read and change their own family's rows. Visitors who are not signed in
-- (the "anon" role) cannot read or change anything.
--
-- These column names must match js/sync.js exactly.

-- =====================================================================================
-- 1. Tables
-- =====================================================================================

create table if not exists public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  consent_version text not null check (char_length(consent_version) between 1 and 32),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  -- The id is made on the device (a random UUID) so a profile can be created offline.
  id uuid primary key,
  parent_id uuid not null references public.parents (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  avatar text check (avatar is null or char_length(avatar) <= 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists children_parent_id_idx on public.children (parent_id);

create table if not exists public.progress (
  child_id uuid not null references public.children (id) on delete cascade,
  -- Activity ids are short slugs such as 'tens-make-a-hundred'.
  activity_id text not null check (char_length(activity_id) between 1 and 64 and activity_id ~ '^[a-z0-9][a-z0-9_-]*$'),
  stars integer not null default 0 check (stars between 0 and 3),
  plays integer not null default 0 check (plays >= 0),
  first_try integer not null default 0 check (first_try >= 0),
  answered integer not null default 0 check (answered >= 0),
  last_played timestamptz,
  -- Counts of each kind of mistake, e.g. {"forgot-to-carry": 2}. Kept small.
  mistakes jsonb not null default '{}'::jsonb check (jsonb_typeof(mistakes) = 'object' and octet_length(mistakes::text) <= 16384),
  updated_at timestamptz not null default now(),
  primary key (child_id, activity_id)
);

-- =====================================================================================
-- 2. Triggers: keep updated_at current, and limit each family to 10 children
-- =====================================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists children_set_updated_at on public.children;
create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before insert or update on public.progress
  for each row execute function public.set_updated_at();

create or replace function public.limit_children_per_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- An upsert of an existing child also passes through here (Postgres runs BEFORE INSERT
  -- triggers before it notices the conflict), so the child's own id is not counted.
  if (select count(*) from public.children c
      where c.parent_id = new.parent_id and c.id <> new.id) >= 10 then
    raise exception 'A family can have at most 10 child profiles.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists children_limit on public.children;
create trigger children_limit
  before insert on public.children
  for each row execute function public.limit_children_per_parent();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.limit_children_per_parent() from public, anon, authenticated;

-- =====================================================================================
-- 3. Row level security: each parent sees only their own family
-- =====================================================================================
-- "(select auth.uid())" is the signed-in parent's id; the extra "select" lets Postgres
-- work it out once per query instead of once per row.
-- An upsert (insert-or-update) needs the select, insert and update rules all to pass.

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.progress enable row level security;

-- parents ---------------------------------------------------------------------------
drop policy if exists "parents: read own" on public.parents;
create policy "parents: read own" on public.parents
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "parents: add own" on public.parents;
create policy "parents: add own" on public.parents
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "parents: change own" on public.parents;
create policy "parents: change own" on public.parents
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "parents: remove own" on public.parents;
create policy "parents: remove own" on public.parents
  for delete to authenticated
  using (id = (select auth.uid()));

-- children --------------------------------------------------------------------------
-- WITH CHECK on insert and update means a parent can never attach a child to another
-- parent, and an upsert that reuses another family's child id fails instead of taking it.
drop policy if exists "children: read own" on public.children;
create policy "children: read own" on public.children
  for select to authenticated
  using (parent_id = (select auth.uid()));

drop policy if exists "children: add own" on public.children;
create policy "children: add own" on public.children
  for insert to authenticated
  with check (parent_id = (select auth.uid()));

drop policy if exists "children: change own" on public.children;
create policy "children: change own" on public.children
  for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

drop policy if exists "children: remove own" on public.children;
create policy "children: remove own" on public.children
  for delete to authenticated
  using (parent_id = (select auth.uid()));

-- progress --------------------------------------------------------------------------
drop policy if exists "progress: read own" on public.progress;
create policy "progress: read own" on public.progress
  for select to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));

drop policy if exists "progress: add own" on public.progress;
create policy "progress: add own" on public.progress
  for insert to authenticated
  with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));

drop policy if exists "progress: change own" on public.progress;
create policy "progress: change own" on public.progress
  for update to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));

drop policy if exists "progress: remove own" on public.progress;
create policy "progress: remove own" on public.progress
  for delete to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid())));

-- =====================================================================================
-- 4. Table permissions: nothing for visitors, the basics for signed-in parents
-- =====================================================================================

revoke all on public.parents, public.children, public.progress from anon;
revoke all on public.parents, public.children, public.progress from public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.parents, public.children, public.progress to authenticated;

-- =====================================================================================
-- 5. "Delete my account": removes the parent's login and, through the cascades above,
--    every child profile and every progress record of that family.
-- =====================================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'You need to be signed in to delete your account.'
      using errcode = 'insufficient_privilege';
  end if;
  -- The family's data goes first (also covered by the cascade), then the login itself.
  delete from public.parents where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
