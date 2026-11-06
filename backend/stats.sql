-- Interactive Maths: how many families use accounts.
-- Paste into Supabase → SQL Editor → Run. It only reads; nothing is changed.
-- Families who use the site without an account (progress saved on the device only)
-- are not counted here: the site does no tracking.

-- 1. Summary
select
  (select count(*) from auth.users)                                         as sign_ups,
  (select count(*) from public.parents)                                     as parents_agreed,
  (select count(*) from public.children)                                    as children,
  (select count(distinct c.parent_id) from public.progress p
     join public.children c on c.id = p.child_id
    where p.last_played > now() - interval '7 days')                        as families_active_7_days,
  (select count(distinct c.parent_id) from public.progress p
     join public.children c on c.id = p.child_id
    where p.last_played > now() - interval '30 days')                       as families_active_30_days,
  (select coalesce(sum(plays), 0) from public.progress)                     as activities_played,
  (select coalesce(sum(stars), 0) from public.progress)                     as stars_earned;

-- 2. New sign-ups per week
select date_trunc('week', created_at)::date as week, count(*) as new_parents
from auth.users
group by 1
order by 1 desc;

-- 3. Most played activities
select activity_id, sum(plays) as plays, count(*) as children, round(avg(stars), 1) as avg_stars
from public.progress
group by activity_id
order by plays desc
limit 20;
