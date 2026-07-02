-- Per-user AI-generated custom study plans. A user with no rows here is on
-- the default GATE CSE plan (topics.month/week_number as seeded); a user
-- with rows here sees only the topics scheduled here, at the month/week
-- assigned here, instead of the defaults. Existing user_topic_progress is
-- never touched by this — excluding a topic just hides it, it doesn't
-- delete completion history.

create table public.user_topic_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  month int not null,
  week_number int not null,
  order_index int not null,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index user_topic_schedule_user_idx on public.user_topic_schedule (user_id);

alter table public.user_topic_schedule enable row level security;

-- Owner-only visibility — custom plans are personal, not shared with squad
-- mates (who only ever see aggregate streak/progress %, never topic lists).
create policy user_topic_schedule_select on public.user_topic_schedule
  for select to authenticated
  using (user_id = auth.uid());

-- No direct insert/update/delete policy: all writes go through
-- replace_user_schedule() below. It has to be `security definer` — there's
-- no INSERT/DELETE policy on this table, so an invoker-rights function
-- would have its own delete/insert silently blocked by RLS. Safe to elevate
-- here because every write is hardcoded to v_uid (the caller's own id,
-- from auth.uid()), never a client-supplied value — same pattern as
-- create_squad()/redeem_invite() above. This also keeps "apply" and "reset
-- to default" atomic — delete-then-insert as two separate client calls
-- could partially fail.
create function public.replace_user_schedule(entries jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.user_topic_schedule where user_id = v_uid;

  insert into public.user_topic_schedule (user_id, topic_id, month, week_number, order_index)
  select
    v_uid,
    (e ->> 'topicId')::uuid,
    (e ->> 'month')::int,
    (e ->> 'weekNumber')::int,
    (e ->> 'orderIndex')::int
  from jsonb_array_elements(entries) as e;
end;
$$;

grant execute on function public.replace_user_schedule(jsonb) to authenticated;

-- user_topic_schedule is owner-only (custom plans are personal), but squad
-- progress % needs each member's *topic count* to stay fair when plans
-- differ. This exposes just the aggregate count for the caller's own
-- squad(s) — never the actual scheduled topics/months of other members.
create function public.squad_topic_counts()
returns table (user_id uuid, topic_count int)
language sql
security definer
stable
set search_path = public
as $$
  select sm.user_id, coalesce(count(uts.id), 0)::int as topic_count
  from public.squad_members sm
  left join public.user_topic_schedule uts on uts.user_id = sm.user_id
  where sm.squad_id in (
    select squad_id from public.squad_members where user_id = auth.uid()
  )
  group by sm.user_id
$$;

grant execute on function public.squad_topic_counts() to authenticated;
