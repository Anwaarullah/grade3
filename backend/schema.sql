-- Grade 3 Maths: database for parent accounts and cloud sync (Supabase).
--
-- How to use: open your Supabase project, go to "SQL Editor", paste this whole file
-- and press "Run". It is safe to run again later (for example after an update): it
-- only creates what is missing and refreshes the rules and functions.
--
-- What it stores (and nothing else):
--   parents   one row per signed-in parent: which privacy notice version they agreed to, and when
--             (the time is set by the database, not by the parent's device).
--             (The parent's email, and with Google their name, picture link and Google account id,
--             live in Supabase's own auth tables, not here. Supabase also keeps each signed-in
--             device's IP address and browser in auth.sessions, and a sign-in log (time, IP
--             address, email address and what happened) in auth.audit_log_entries; "Delete my
--             account" removes both (the log, in rare cases, by the owner's next monthly
--             clean-up). A device that signed out without a connection, or whose browser
--             data was cleared, stays in auth.sessions until the account is deleted or the
--             owner's clean-up removes it: see
--             docs/SETUP-ACCOUNTS.md, "Looking after families' data".)
--   children  each child profile: a nickname, an emoji avatar, and how many times and when
--             progress was last reset (with the ids of the last 20 resets). No email, no
--             birthday, no photo.
--   progress  one row per child per activity: stars, plays, answers, right-first-time and mistake
--             counts, when it was last played, and which reset it was built after.
--   Every table also has created/updated times.
--   (Outside these tables, Supabase's own request logs (time, IP address, browser, the address
--   asked for and, for sign-in requests, the email address or account id), the email service and
--   the web host keep technical logs for their own periods; see docs/SETUP-ACCOUNTS.md.)
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
  -- "Reset progress" is counted, not timed (device clocks can be wrong): reset_gen is how many
  -- times it was pressed, and records built on a lower count are blank (see the triggers).
  -- reset_id is the id the device gave the latest reset, and recent_reset_ids the ids of the
  -- last 20, so sending one again (e.g. after a lost reply) does not count twice. reset_at is
  -- when the database received the latest one.
  reset_gen integer not null default 0 check (reset_gen >= 0),
  reset_id uuid,
  recent_reset_ids uuid[] not null default '{}',
  reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after the first version of this file: brings an existing table up to date.
alter table public.children add column if not exists reset_at timestamptz;
alter table public.children add column if not exists reset_gen integer not null default 0 check (reset_gen >= 0);
alter table public.children add column if not exists reset_id uuid;
alter table public.children add column if not exists recent_reset_ids uuid[] not null default '{}';

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
  mistakes jsonb not null default '{}'::jsonb,
  -- The child's reset_gen this record was built on.
  reset_gen integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (child_id, activity_id)
);

-- Added after the first version of this file. That version marked resets by the device's clock
-- and left the records from before a reset in place (the devices hid them): remove those once.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'progress' and column_name = 'reset_gen') then
    alter table public.progress add column reset_gen integer not null default 0;
    delete from public.progress p using public.children c
      where p.child_id = c.id and c.reset_at is not null
        and (p.last_played is null or p.last_played <= c.reset_at);
  end if;
end;
$$;

-- Mistake counts: an object of at most 4 KB (re-created so that re-running updates the limit).
alter table public.progress drop constraint if exists progress_mistakes_check;
alter table public.progress add constraint progress_mistakes_check
  check (jsonb_typeof(mistakes) = 'object' and octet_length(mistakes::text) <= 4096);

-- =====================================================================================
-- 2. Triggers: keep times current, count resets and clear what came before them, record
--    when consent was given, and limit each family to 10 children and each child to 400
--    activity records
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

-- Resets are counted here, never by a device: a device sends a new reset_id when "Reset
-- progress" is pressed on it, and only then does the count go up. Sending an id again (for
-- example after a lost reply, even when another device reset the child meanwhile) changes
-- nothing: the ids of the last 20 resets are kept. A device that does not know about a newer
-- reset can never undo or lower it. A profile made on a device arrives with that device's own
-- count. reset_at is the database's clock.
create or replace function public.keep_latest_reset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.reset_at := case when new.reset_gen > 0 then now() end;
    new.recent_reset_ids := case when new.reset_id is not null then array[new.reset_id] else '{}'::uuid[] end;
  elsif new.reset_id is not null and new.reset_id is distinct from old.reset_id
        and not (new.reset_id = any(old.recent_reset_ids)) then
    new.reset_gen := old.reset_gen + 1;
    new.reset_at := now();
    new.recent_reset_ids := (array[new.reset_id] || old.recent_reset_ids)[1:20];
  else
    new.reset_gen := old.reset_gen;
    new.reset_id := old.reset_id;
    new.reset_at := old.reset_at;
    new.recent_reset_ids := old.recent_reset_ids;
  end if;
  return new;
end;
$$;

drop trigger if exists children_keep_latest_reset on public.children;
create trigger children_keep_latest_reset
  before insert or update on public.children
  for each row execute function public.keep_latest_reset();

-- After a reset, the child's records from before it are deleted, including those of activities
-- the resetting device never had. (Runs with the parent's own rights.)
create or replace function public.clear_progress_before_reset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reset_gen > old.reset_gen then
    delete from public.progress p where p.child_id = new.id and p.reset_gen < new.reset_gen;
  end if;
  return null;
end;
$$;

drop trigger if exists children_clear_progress_before_reset on public.children;
create trigger children_clear_progress_before_reset
  after update on public.children
  for each row execute function public.clear_progress_before_reset();

-- A device that has not heard of a reset yet may still send records built before it (for
-- example a child played on it offline): they are skipped, and what is stored is kept.
create or replace function public.skip_progress_before_reset()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reset_gen < coalesce((select c.reset_gen from public.children c where c.id = new.child_id), 0) then
    return null;
  end if;
  return new;
end;
$$;

-- (Triggers of the same kind run in name order: this one before progress_limit.)
drop trigger if exists progress_keep_reset on public.progress;
create trigger progress_keep_reset
  before insert or update on public.progress
  for each row execute function public.skip_progress_before_reset();

-- Two devices may send the same record (one of them before it has fetched the other's): the
-- stored record is never lowered. The same rule as mergeRecord in js/sync.js: the most stars,
-- plays and latest play time, and the answers and mistakes of whichever record has more
-- history. (A record from after a later reset replaces one from before it.)
create or replace function public.keep_richer_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  diff numeric;
  key_new text;
  key_old text;
begin
  if new.reset_gen <> old.reset_gen then
    if new.reset_gen < old.reset_gen then
      return null; -- built before a reset the stored record is from after: keep what is stored
    end if;
    return new;
  end if;
  diff := new.answered - old.answered;
  if diff = 0 then
    diff := extract(epoch from coalesce(new.last_played, 'epoch'::timestamptz))
          - extract(epoch from coalesce(old.last_played, 'epoch'::timestamptz));
  end if;
  if diff = 0 then
    diff := new.first_try - old.first_try;
  end if;
  if diff = 0 then
    -- Like mistakesKey in js/sync.js: the counts in key order, e.g. [["carry",2],["gaps",1]].
    select coalesce('[' || string_agg('[' || to_json(e.key)::text || ','
             || case when jsonb_typeof(e.value) = 'number' then e.value::text else '0' end || ']',
             ',' order by e.key collate "C") || ']', '[]')
      into key_new from jsonb_each(new.mistakes) e;
    select coalesce('[' || string_agg('[' || to_json(e.key)::text || ','
             || case when jsonb_typeof(e.value) = 'number' then e.value::text else '0' end || ']',
             ',' order by e.key collate "C") || ']', '[]')
      into key_old from jsonb_each(old.mistakes) e;
  end if;
  -- The stored record has more history: keep its answers and mistakes.
  if diff < 0 or (diff = 0 and key_new < key_old collate "C") then
    new.answered := old.answered;
    new.first_try := old.first_try;
    new.mistakes := old.mistakes;
  end if;
  new.stars := greatest(new.stars, old.stars);
  new.plays := greatest(new.plays, old.plays);
  new.last_played := greatest(new.last_played, old.last_played);
  return new;
end;
$$;

-- (Runs after progress_keep_reset: triggers of the same kind run in name order.)
drop trigger if exists progress_keep_richer on public.progress;
create trigger progress_keep_richer
  before update on public.progress
  for each row execute function public.keep_richer_progress();

-- The consent time is the database's clock, never the device's: set on first agreement and
-- whenever a new notice version is agreed to; otherwise the stored time is kept.
create or replace function public.set_consented_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.consented_at := now();
    new.created_at := now();
  else
    new.created_at := old.created_at;
    if new.consent_version is distinct from old.consent_version then
      new.consented_at := now();
    else
      new.consented_at := old.consented_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parents_set_consented_at on public.parents;
create trigger parents_set_consented_at
  before insert or update on public.parents
  for each row execute function public.set_consented_at();

create or replace function public.limit_children_per_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- One family's inserts wait for each other, so two at once cannot both count 9.
  perform 1 from public.parents p where p.id = new.parent_id for update;
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

-- Each child can have at most 400 activity records (the site has about 105 activities), so one
-- account cannot fill the database for every family.
create or replace function public.limit_progress_per_child()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- One family's inserts wait for each other (as for children above), so requests sent at the
  -- same time cannot each add 400. The family's row is locked, not the child's: one request
  -- holds records of several children, and locking those one by one could deadlock.
  perform 1 from public.parents p
    where p.id = (select c.parent_id from public.children c where c.id = new.child_id)
    for update;
  -- As above, an upsert of an existing record passes through here: it is not counted.
  if (select count(*) from public.progress p
      where p.child_id = new.child_id and p.activity_id <> new.activity_id) >= 400 then
    raise exception 'A child can have at most 400 activity records.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists progress_limit on public.progress;
create trigger progress_limit
  before insert on public.progress
  for each row execute function public.limit_progress_per_child();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.keep_latest_reset() from public, anon, authenticated;
revoke execute on function public.clear_progress_before_reset() from public, anon, authenticated;
revoke execute on function public.skip_progress_before_reset() from public, anon, authenticated;
revoke execute on function public.set_consented_at() from public, anon, authenticated;
revoke execute on function public.limit_children_per_parent() from public, anon, authenticated;
revoke execute on function public.limit_progress_per_child() from public, anon, authenticated;
revoke execute on function public.keep_richer_progress() from public, anon, authenticated;

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
-- Supabase gives new tables every privilege (also TRUNCATE, which ignores RLS): start again from
-- nothing, so a re-run always leaves exactly the four below.
revoke all on public.parents, public.children, public.progress from authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.parents, public.children, public.progress to authenticated;

-- =====================================================================================
-- 5. "Delete my account": removes the parent's login and, through the cascades above,
--    every child profile and every progress record of that family, the signed-in devices
--    (auth.sessions) and the sign-in log entries about this parent.
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
  -- The sign-in log has no link to auth.users, so it is not covered by the cascade. If this
  -- project does not allow it, the account is still deleted, a warning goes to the Postgres
  -- logs, and the owner's monthly clean-up removes the entries left behind (see
  -- docs/SETUP-ACCOUNTS.md).
  begin
    delete from auth.audit_log_entries
      where payload->>'actor_id' = uid::text or payload->'traits'->>'user_id' = uid::text;
  exception when insufficient_privilege or undefined_table then
    raise warning 'delete_my_account: sign-in log not removed for %', uid;
  end;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
