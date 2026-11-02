-- ═══════════════════════════════════════════════════════════════
-- S7 — Les adresses se comparent en minuscules.
--
-- app.mon_role() et la policy « chacun lit son role » comparaient
-- l'adresse telle quelle. Un écart de casse (jeton en minuscules,
-- ligne saisie autrement) faisait rater le rôle : la console
-- retombait sur « client ». L'index lower(email) porte la recherche.
--
-- Les policies de la messagerie sont réécrites comme en S1, pour
-- que ce fichier reste suffisant même relu seul après S1.
-- ═══════════════════════════════════════════════════════════════

create or replace function app.mon_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.roles
   where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function app.mon_agence()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(nullif(agence, ''), null)
    from public.roles
   where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create index if not exists roles_email_lower_idx
  on public.roles (lower(email));

drop policy if exists "chacun lit son role" on public.roles;
create policy "chacun lit son role" on public.roles
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "messages_envoi" on public.messages;
create policy "messages_envoi" on public.messages
  for insert to public
  with check (
    app.mon_role() in ('master', 'commercial', 'atelier')
    and lower(expediteur) = lower(app.mon_email())
    and exists (
      select 1 from public.roles r
       where lower(r.email) = lower(messages.destinataire)
         and r.role in ('master', 'commercial', 'atelier')
    )
  );
