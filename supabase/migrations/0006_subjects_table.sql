-- Promotes topics.subject from a free-text label to a first-class,
-- ordered reference table. order_index is computed once here, from each
-- subject's earliest appearance in the seeded plan's own (month,
-- week_number, order_index) sequence — i.e. "planner order", not the order
-- sections appear in the official GATE syllabus PDF and not alphabetical.

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  syllabus_id uuid not null references public.syllabi (id) on delete cascade,
  name text not null,
  slug text not null,
  order_index int not null,
  icon text,
  created_at timestamptz not null default now(),
  unique (syllabus_id, slug),
  unique (syllabus_id, name)
);

create index subjects_syllabus_order_idx on public.subjects (syllabus_id, order_index);

-- Backfill: one subjects row per distinct (syllabus_id, subject) currently
-- on topics, ordered by that subject's earliest planner appearance.
with topic_rank as (
  select
    id, syllabus_id, subject,
    row_number() over (partition by syllabus_id order by month, week_number, order_index) as plan_rank
  from public.topics
),
subject_first as (
  select syllabus_id, subject, min(plan_rank) as first_rank
  from topic_rank
  group by syllabus_id, subject
)
insert into public.subjects (syllabus_id, name, slug, order_index)
select
  syllabus_id,
  subject,
  trim(both '-' from lower(regexp_replace(subject, '[^a-zA-Z0-9]+', '-', 'g'))),
  row_number() over (partition by syllabus_id order by first_rank) - 1
from subject_first;

alter table public.topics add column subject_id uuid references public.subjects (id) on delete cascade;

update public.topics t
set subject_id = s.id
from public.subjects s
where s.syllabus_id = t.syllabus_id and s.name = t.subject;

do $$
begin
  if exists (select 1 from public.topics where subject_id is null) then
    raise exception 'topics.subject_id backfill incomplete — aborting before drop';
  end if;
end $$;

alter table public.topics alter column subject_id set not null;
create index topics_subject_id_idx on public.topics (subject_id);

-- No back-compat column kept — every reader is updated in the same change.
alter table public.topics drop column subject;

-- Reference data: readable by any authenticated user, writable only via
-- migrations/service role, same pattern as syllabi_select/topics_select.
alter table public.subjects enable row level security;

create policy subjects_select on public.subjects
  for select to authenticated
  using (true);
