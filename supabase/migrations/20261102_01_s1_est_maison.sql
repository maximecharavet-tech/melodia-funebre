-- ═══════════════════════════════════════════════════════════════
-- S1 — Le compte commercial ne lit ni ne modifie les commandes,
-- les demandes, les mémoriaux, les publications, ni le dossier
-- « hommages ».
--
-- Le live définit app.est_maison() comme « master OU commercial ».
-- Toutes les policies sensibles s'appuient dessus. On retire
-- commercial. Le rôle « atelier » n'existe pas dans la contrainte
-- de public.roles (master, commercial, partner, client) : il est
-- cité pour le jour où une ligne le porterait, et il ne l'est pas
-- aujourd'hui.
--
-- Ce qui ne doit PAS casser :
--   · la messagerie interne (policies réécrites explicitement) ;
--   · l'écriture du carnet de prospects du commercial ;
--   · l'agenda (policies déjà bornées à mon_role() = 'commercial') ;
--   · le partenaire, qui continue de voir les commandes de son agence ;
--   · le fondateur (master), inchangé.
--
-- Preuve, avec le jeton d'un compte commercial :
--   select count(*) from public.orders;                 -- 0
--   update public.orders set status = 'livree';         -- 0 ligne
-- Le fondateur, lui, continue de lire et de faire avancer.
-- ═══════════════════════════════════════════════════════════════

create or replace function app.est_maison()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app.mon_role() in ('master', 'atelier'), false);
$$;

-- ─── Messagerie : le commercial y reste ───────────────────────
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

drop policy if exists "messages_lecture" on public.messages;
create policy "messages_lecture" on public.messages
  for select to public
  using (
    app.mon_role() in ('master', 'commercial', 'atelier')
    and (
      lower(expediteur) = lower(app.mon_email())
      or lower(destinataire) = lower(app.mon_email())
    )
  );

drop policy if exists "messages_lu" on public.messages;
create policy "messages_lu" on public.messages
  for update to public
  using (
    app.mon_role() in ('master', 'commercial', 'atelier')
    and lower(destinataire) = lower(app.mon_email())
  )
  with check (
    app.mon_role() in ('master', 'commercial', 'atelier')
    and lower(destinataire) = lower(app.mon_email())
  );

-- ─── Prospection : le commercial écrit toujours SON carnet ────
drop policy if exists "la maison ecrit sa prospection" on public.prospects;
create policy "la maison ecrit sa prospection" on public.prospects
  for insert to authenticated
  with check (
    app.mon_role() in ('master', 'commercial', 'atelier')
    and (
      lower(owner) = lower(auth.jwt() ->> 'email')
      or app.est_master()
    )
  );

-- ─── Commandes : la voie « agence » est celle du partenaire ───
drop policy if exists "chacun lit ses commandes" on public.orders;
create policy "chacun lit ses commandes" on public.orders
  for select to public
  using (
    lower(user_email) = lower(auth.jwt() ->> 'email')
    or app.est_maison()
    or (
      app.mon_role() = 'partner'
      and app.mon_agence() is not null
      and agence = app.mon_agence()
    )
  );

-- La policy UPDATE « la maison fait avancer les commandes » appelle
-- déjà app.est_maison() : elle devient réservée au fondateur sans
-- être réécrite. Idem demandes (lecture et mise à jour « maison »),
-- publications, et le dépôt dans le dossier hommages.

-- ─── Mémoriaux : même resserrement ────────────────────────────
drop policy if exists "memoriaux_lecture" on public.memoriaux;
create policy "memoriaux_lecture" on public.memoriaux
  for select to public
  using (
    app.est_maison()
    or lower(proprietaire) = lower(app.mon_email())
    or (
      app.mon_role() = 'partner'
      and app.mon_agence() is not null
      and agence = app.mon_agence()
    )
  );

drop policy if exists "memoriaux_ecriture" on public.memoriaux;
create policy "memoriaux_ecriture" on public.memoriaux
  for insert to public
  with check (
    app.est_maison()
    or lower(proprietaire) = lower(app.mon_email())
    or (
      app.mon_role() = 'partner'
      and app.mon_agence() is not null
      and agence = app.mon_agence()
    )
  );

drop policy if exists "memoriaux_maj" on public.memoriaux;
create policy "memoriaux_maj" on public.memoriaux
  for update to public
  using (
    app.est_maison()
    or lower(proprietaire) = lower(app.mon_email())
    or (
      app.mon_role() = 'partner'
      and app.mon_agence() is not null
      and agence = app.mon_agence()
    )
  )
  with check (
    app.est_maison()
    or lower(proprietaire) = lower(app.mon_email())
    or (
      app.mon_role() = 'partner'
      and app.mon_agence() is not null
      and agence = app.mon_agence()
    )
  );
