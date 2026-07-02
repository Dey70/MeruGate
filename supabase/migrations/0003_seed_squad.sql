-- Pre-seeds the one squad that exists today for the 3-person research team,
-- plus a standing invite code so each teammate just redeems it on first
-- login (via `select public.redeem_invite('MEERUGATE2026');` or the /squad
-- join form) instead of someone having to remember to create it in the UI.
--
-- created_by is left null here since no auth users exist yet at migration
-- time — squads.created_by and squad_invites.created_by are nullable for
-- exactly this reason. Safe to re-run: skips if already seeded.

do $$
declare
  v_squad_id uuid;
begin
  if exists (select 1 from public.squads where name = 'GATE CSE Squad') then
    return;
  end if;

  insert into public.squads (name) values ('GATE CSE Squad') returning id into v_squad_id;

  insert into public.squad_invites (squad_id, code)
  values (v_squad_id, 'MEERUGATE2026');
end $$;
