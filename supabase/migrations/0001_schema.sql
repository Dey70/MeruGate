-- MeeruGate schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query) on a fresh project.
-- Architected for multi-tenant growth: no hardcoded user ids, no squad size limits.

create extension if not exists pgcrypto;

-- ============================================================================
-- Tables
-- ============================================================================

-- Mirrors auth.users so we can join user metadata without touching the auth schema.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Seed data (topics) lives in a separate migration file so other syllabi can be
-- seeded later without touching this schema.
create table public.syllabi (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  syllabus_id uuid not null references public.syllabi (id) on delete cascade,
  subject text not null,
  title text not null,
  month int not null,
  week_number int not null,
  order_index int not null,
  created_at timestamptz not null default now()
);

create index topics_syllabus_order_idx
  on public.topics (syllabus_id, month, week_number, order_index);

-- Current-state completion row per (user, topic). Not append-only: toggling a
-- topic back off overwrites completed_at. At small scale this is an accepted
-- simplification (see streaks view below) rather than a full activity log.
create table public.user_topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index user_topic_progress_user_idx on public.user_topic_progress (user_id);
create index user_topic_progress_topic_idx on public.user_topic_progress (topic_id);

create table public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.squad_invites (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  code text not null unique,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses int,
  uses_count int not null default 0
);

create index squad_invites_squad_idx on public.squad_invites (squad_id);

-- No unique(user_id): a user could belong to multiple squads in the future.
-- The MVP UI only ever deals with 0 or 1 squad per user.
create table public.squad_members (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (squad_id, user_id)
);

create index squad_members_squad_idx on public.squad_members (squad_id);
create index squad_members_user_idx on public.squad_members (user_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  content_md text not null default '',
  notion_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index notes_user_idx on public.notes (user_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  target_topic_count int not null check (target_topic_count > 0),
  -- '' (not null) means "any topic counts", not scoped to one subject.
  -- Kept non-null so the unique constraint below actually dedupes: Postgres
  -- unique constraints treat NULL <> NULL, so a nullable subject would let
  -- upserts silently insert duplicate "no subject" goals instead of
  -- updating the existing one.
  subject text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, period_type, period_start, subject)
);

create index goals_user_idx on public.goals (user_id);

create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  topic_id uuid references public.topics (id) on delete set null,
  created_at timestamptz not null default now()
);

create index chat_history_user_session_idx
  on public.chat_history (user_id, session_id, created_at);

-- ============================================================================
-- Auto-provision public.users on signup
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_user_topic_progress
  before update on public.user_topic_progress
  for each row execute function public.set_updated_at();

create trigger set_updated_at_notes
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Streak support: on-the-fly view over completion days (not denormalized).
-- security_invoker means this view is subject to the querying user's RLS on
-- user_topic_progress, so it never leaks data a policy wouldn't already allow.
-- Dates are bucketed in UTC — an accepted simplification for a small team.
-- ============================================================================

create view public.user_activity_days
with (security_invoker = true) as
select
  user_id,
  (completed_at at time zone 'utc')::date as activity_date
from public.user_topic_progress
where completed = true and completed_at is not null
group by user_id, (completed_at at time zone 'utc')::date;

-- ============================================================================
-- RLS helper: caller's squad ids, security definer to avoid recursive
-- squad_members policies referencing squad_members.
-- ============================================================================

create function public.my_squad_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select squad_id from public.squad_members where user_id = auth.uid()
$$;

grant execute on function public.my_squad_ids() to authenticated;

-- ============================================================================
-- Squad creation + invite redemption go through security definer functions
-- so squad_members never needs a client-facing INSERT policy (all writes are
-- validated/atomic here), and invite codes can't be enumerated via SELECT.
-- ============================================================================

create function public.create_squad(squad_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_squad_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.squads (name, created_by)
  values (squad_name, v_uid)
  returning id into v_squad_id;

  insert into public.squad_members (squad_id, user_id)
  values (v_squad_id, v_uid);

  return v_squad_id;
end;
$$;

grant execute on function public.create_squad(text) to authenticated;

create function public.redeem_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite
  from public.squad_invites
  where code = invite_code
  for update;

  if not found then
    raise exception 'invalid invite code';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite code has expired';
  end if;

  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    raise exception 'invite code has reached its usage limit';
  end if;

  insert into public.squad_members (squad_id, user_id)
  values (v_invite.squad_id, v_uid)
  on conflict (squad_id, user_id) do nothing;

  update public.squad_invites
  set uses_count = uses_count + 1
  where id = v_invite.id;

  return v_invite.squad_id;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.users enable row level security;
alter table public.syllabi enable row level security;
alter table public.topics enable row level security;
alter table public.user_topic_progress enable row level security;
alter table public.squads enable row level security;
alter table public.squad_invites enable row level security;
alter table public.squad_members enable row level security;
alter table public.notes enable row level security;
alter table public.goals enable row level security;
alter table public.chat_history enable row level security;

-- users: self, plus fellow squad members (needed to render a squad roster)
create policy users_select on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or id in (
      select user_id from public.squad_members
      where squad_id in (select public.my_squad_ids())
    )
  );

create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- syllabi / topics: shared reference data, readable by any authenticated
-- user, writable only via migrations/service role (no policy = no client write).
create policy syllabi_select on public.syllabi
  for select to authenticated
  using (true);

create policy topics_select on public.topics
  for select to authenticated
  using (true);

-- user_topic_progress: owner can do anything; fellow squad members can view
-- (this is what powers shared streaks/progress %, never a public leaderboard).
create policy user_topic_progress_select on public.user_topic_progress
  for select to authenticated
  using (
    user_id = auth.uid()
    or user_id in (
      select user_id from public.squad_members
      where squad_id in (select public.my_squad_ids())
    )
  );

create policy user_topic_progress_insert on public.user_topic_progress
  for insert to authenticated
  with check (user_id = auth.uid());

create policy user_topic_progress_update on public.user_topic_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_topic_progress_delete on public.user_topic_progress
  for delete to authenticated
  using (user_id = auth.uid());

-- squads / squad_invites / squad_members: members only, no cross-squad and
-- no public visibility anywhere.
create policy squads_select on public.squads
  for select to authenticated
  using (id in (select public.my_squad_ids()));

create policy squad_invites_select on public.squad_invites
  for select to authenticated
  using (squad_id in (select public.my_squad_ids()));

create policy squad_invites_insert on public.squad_invites
  for insert to authenticated
  with check (
    squad_id in (select public.my_squad_ids())
    and created_by = auth.uid()
  );

create policy squad_members_select on public.squad_members
  for select to authenticated
  using (squad_id in (select public.my_squad_ids()));

create policy squad_members_delete_self on public.squad_members
  for delete to authenticated
  using (user_id = auth.uid());

-- notes / goals: strictly owner-only. The spec shares streaks/progress with
-- a squad, not personal notes or goals.
create policy notes_all on public.notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy goals_all on public.goals
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- chat_history: owner-only, no update policy (append-only log); delete
-- allowed so a user can clear their own history.
create policy chat_history_select on public.chat_history
  for select to authenticated
  using (user_id = auth.uid());

create policy chat_history_insert on public.chat_history
  for insert to authenticated
  with check (user_id = auth.uid());

create policy chat_history_delete on public.chat_history
  for delete to authenticated
  using (user_id = auth.uid());
