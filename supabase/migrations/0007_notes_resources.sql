-- Generalizes the single notion_link field into a small typed list of
-- resources (YouTube/article/PDF/practice/other), since students collect
-- more than one reference per topic in practice. jsonb over a separate
-- table: bounded per-note list, no cross-user querying needed, and notes
-- are already owner-only end-to-end (notes_all RLS policy covers the whole
-- row already, so no policy change is needed here).

alter table public.notes
  add column resources jsonb not null default '[]'::jsonb;

alter table public.notes
  add constraint notes_resources_is_array check (jsonb_typeof(resources) = 'array');

update public.notes
set resources = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'label', 'Notion', 'url', notion_link, 'type', 'other')
)
where notion_link is not null and notion_link <> '';

alter table public.notes drop column notion_link;
