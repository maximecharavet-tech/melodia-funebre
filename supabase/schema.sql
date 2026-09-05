-- ═══════════════════════════════════════════════════════════════
-- MELODIA FUNÈBRE — schéma Supabase
--
-- À coller tel quel dans Supabase → SQL Editor → New query → Run.
-- Le script est idempotent : le relancer ne casse rien.
--
-- ─────────────────────────────────────────────────────────────
-- POURQUOI LA SÉCURITÉ OCCUPE LA MOITIÉ DE CE FICHIER
--
-- La clé « anon » est publique par construction : elle est écrite
-- dans assets/js/config.js, donc lisible par quiconque affiche le
-- code source de la page. C'est normal et prévu — mais cela signifie
-- que TOUTE la protection des données repose sur le Row Level
-- Security de PostgreSQL. Sans les règles ci-dessous, n'importe qui
-- pourrait lire la table « orders », qui contient le nom, l'adresse
-- et le téléphone de familles en deuil, ainsi que le prénom du
-- défunt, ses traits de caractère, son métier et ses habitudes.
--
-- Ces règles ne font PAS confiance au rôle déclaré par le client.
-- Supabase laisse le navigateur choisir librement son
-- « user_metadata » au moment de l'inscription : un compte créé
-- directement contre l'API avec role='master' obtiendrait sinon la
-- lecture de toutes les commandes. Le rôle est donc lu dans une
-- table « roles » que seule la console Supabase peut écrire.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Les rôles, hors de portée du navigateur ───────────────
create table if not exists public.roles (
  email      text primary key,
  role       text not null check (role in ('master', 'commercial', 'partner')),
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;

-- Chacun peut lire SON rôle, personne ne peut en écrire aucun.
-- L'attribution se fait à la main dans Supabase → Table Editor,
-- ou par une fonction serveur utilisant la clé « service_role ».
drop policy if exists "chacun lit son role" on public.roles;
create policy "chacun lit son role" on public.roles
  for select to authenticated
  using (email = auth.jwt() ->> 'email');

-- Fonctions d'aide : elles évitent de répéter la jointure, et
-- « security definer » leur permet de lire « roles » sans être
-- bloquées par la règle ci-dessus.
create or replace function public.mon_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.roles where email = auth.jwt() ->> 'email';
$$;

create or replace function public.est_maison() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mon_role() in ('master', 'commercial'), false);
$$;

create or replace function public.est_master() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(public.mon_role() = 'master', false);
$$;


-- ─── 2. Les commandes ─────────────────────────────────────────
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  ref            text unique not null,
  created_at     timestamptz not null default now(),
  status         text not null default 'recue',
  user_email     text not null default '',
  user_name      text not null default '',
  agence         text not null default '',
  offer          text not null default '',
  price          numeric,
  defunt         text not null default '',
  traits         text not null default '',
  metier         text not null default '',
  habitude       text not null default '',
  anecdote       text not null default '',
  style          text not null default '',
  rite           text not null default '',
  texte_sacre    text not null default '',
  urgence        boolean not null default false,
  paid           boolean not null default false,
  paypal_id      text not null default '',
  -- Renseignées à la livraison, par l'atelier
  audio_url      text not null default '',
  audio_title    text not null default '',
  music_task_id  text not null default ''
);

create index if not exists orders_email_idx on public.orders (lower(user_email));
create index if not exists orders_date_idx  on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Une famille commande sans compte : l'insertion doit rester ouverte.
-- C'est la même exposition que n'importe quel formulaire public ; si
-- le dépôt de commandes indésirables devenait un problème, il faudrait
-- faire passer l'écriture par une fonction serverless plutôt que par
-- le navigateur.
drop policy if exists "toute famille peut commander" on public.orders;
create policy "toute famille peut commander" on public.orders
  for insert to anon, authenticated with check (true);

-- On ne lit que ses propres commandes — sauf la maison.
drop policy if exists "chacun lit ses commandes" on public.orders;
create policy "chacun lit ses commandes" on public.orders
  for select to authenticated
  using (lower(user_email) = lower(auth.jwt() ->> 'email') or public.est_maison());

drop policy if exists "la maison fait avancer les commandes" on public.orders;
create policy "la maison fait avancer les commandes" on public.orders
  for update to authenticated
  using (public.est_maison()) with check (public.est_maison());

drop policy if exists "seul le fondateur supprime" on public.orders;
create policy "seul le fondateur supprime" on public.orders
  for delete to authenticated using (public.est_master());


-- ─── 3. Les collaborateurs commerciaux ────────────────────────
create table if not exists public.collaborateurs (
  id         text primary key,
  email      text unique not null,
  nom        text not null default '',
  name       text not null default '',
  role       text not null default 'commercial',
  secteur    text not null default '',
  tel        text not null default '',
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.collaborateurs enable row level security;

-- La liste des collaborateurs n'intéresse que le fondateur, et
-- contient leurs coordonnées : elle ne sort pas de là.
drop policy if exists "le fondateur gere ses collaborateurs" on public.collaborateurs;
create policy "le fondateur gere ses collaborateurs" on public.collaborateurs
  for all to authenticated
  using (public.est_master()) with check (public.est_master());

drop policy if exists "chacun lit sa propre fiche" on public.collaborateurs;
create policy "chacun lit sa propre fiche" on public.collaborateurs
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));


-- ─── 4. Les fiches de prospection ─────────────────────────────
create table if not exists public.prospects (
  siret      text primary key,
  siren      text not null default '',
  nom        text not null default '',
  enseigne   text not null default '',
  type       text not null default 'funeraire',
  adresse    text not null default '',
  cp         text not null default '',
  ville      text not null default '',
  email      text not null default '',
  tel        text not null default '',
  site       text not null default '',
  statut     text not null default 'nouveau',
  notes      text not null default '',
  journal    jsonb not null default '[]'::jsonb,
  relance    timestamptz,
  owner      text not null default '',
  owner_nom  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_owner_idx on public.prospects (lower(owner));
create index if not exists prospects_maj_idx   on public.prospects (updated_at desc);

alter table public.prospects enable row level security;

-- Un commercial voit son propre secteur, le fondateur voit tout.
-- Le carnet d'un collaborateur est son outil de travail : ses
-- confrères n'ont pas à y accéder.
drop policy if exists "chacun son carnet" on public.prospects;
create policy "chacun son carnet" on public.prospects
  for select to authenticated
  using (lower(owner) = lower(auth.jwt() ->> 'email') or public.est_master());

drop policy if exists "la maison ecrit sa prospection" on public.prospects;
create policy "la maison ecrit sa prospection" on public.prospects
  for insert to authenticated
  with check (public.est_maison()
              and (lower(owner) = lower(auth.jwt() ->> 'email') or public.est_master()));

drop policy if exists "la maison met a jour sa prospection" on public.prospects;
create policy "la maison met a jour sa prospection" on public.prospects
  for update to authenticated
  using (lower(owner) = lower(auth.jwt() ->> 'email') or public.est_master())
  with check (lower(owner) = lower(auth.jwt() ->> 'email') or public.est_master());

drop policy if exists "la maison retire une fiche" on public.prospects;
create policy "la maison retire une fiche" on public.prospects
  for delete to authenticated
  using (lower(owner) = lower(auth.jwt() ->> 'email') or public.est_master());

-- « updated_at » tenu par la base : le client peut l'oublier, pas elle.
create or replace function public.touche_updated_at() returns trigger
  language plpgsql as $$
  begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists prospects_touche on public.prospects;
create trigger prospects_touche before update on public.prospects
  for each row execute function public.touche_updated_at();


-- ─── 5. Le stockage des œuvres livrées ────────────────────────
-- Le fichier doit être lisible sans compte : la famille reçoit un
-- lien et l'ouvre. L'envoi, lui, est réservé à la maison.
insert into storage.buckets (id, name, public)
  values ('hommages', 'hommages', true)
  on conflict (id) do update set public = true;

drop policy if exists "les oeuvres sont ecoutables" on storage.objects;
create policy "les oeuvres sont ecoutables" on storage.objects
  for select to anon, authenticated using (bucket_id = 'hommages');

drop policy if exists "seule la maison depose une oeuvre" on storage.objects;
create policy "seule la maison depose une oeuvre" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'hommages' and public.est_maison());

drop policy if exists "seule la maison remplace une oeuvre" on storage.objects;
create policy "seule la maison remplace une oeuvre" on storage.objects
  for update to authenticated
  using (bucket_id = 'hommages' and public.est_maison());

drop policy if exists "seul le fondateur retire une oeuvre" on storage.objects;
create policy "seul le fondateur retire une oeuvre" on storage.objects
  for delete to authenticated
  using (bucket_id = 'hommages' and public.est_master());


-- ─── 6. Le compte du fondateur ────────────────────────────────
-- À faire APRÈS avoir créé le compte dans Authentication → Users.
-- Remplacez l'adresse, puis exécutez cette seule ligne :
--
--   insert into public.roles (email, role)
--     values ('contact@melodia-funebre.fr', 'master')
--     on conflict (email) do update set role = 'master';
--
-- Tant que cette ligne n'est pas passée, aucun compte n'est
-- « master » : personne ne peut lire les commandes des autres, pas
-- même vous. C'est voulu — un oubli doit fermer les portes, pas les
-- ouvrir.
