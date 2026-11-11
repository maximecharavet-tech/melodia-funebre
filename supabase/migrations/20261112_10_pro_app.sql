-- Migration 10 — Melodia Funèbre Pro (console /pro)
-- NON APPLIQUÉE automatiquement : elle attend le feu vert de Maxime.
-- Idempotente (if not exists, drop policy if exists, on conflict do nothing).
-- RLS activée sur toutes les tables. Aucune valeur secrète. Aucun prix inventé :
-- les tarifs agence sont NULL (TBD) et se saisissent dans l'écran Admin maison.
--
-- Principe : le navigateur LIT ses données sous RLS (et peut s'abonner au
-- Realtime du statut) ; les ÉCRITURES sensibles passent par les fonctions
-- /api/pro/* qui utilisent la clé de service. Les colonnes status, paid,
-- audio_url, montant_cents, stripe_session_id ne sont modifiables que par le
-- service role : privilèges de colonnes ET déclencheur de garde.
--
-- Identifiants d'état (ASCII) : brouillon, complet, en_attente_paiement, paye,
-- essai_accorde, paroles_en_cours, paroles_a_valider, musique_en_cours,
-- controle_maison, livre, revision_demandee, echec, annule, rembourse.
-- La machine à états fait foi dans melodia-pro-wasm/src/statut.rs.

-- ─── 1. Organisations, sites, membres, invitations ─────────────────────
create table if not exists public.pro_orgs (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text not null,
  siret               text not null default '',
  email               text not null default '',
  telephone           text not null default '',
  statut              text not null default 'en_attente'
                       check (statut in ('en_attente', 'valide', 'refuse', 'suspendu')),
  valide_par          text,
  valide_le           timestamptz,
  stripe_customer_id  text,
  logo_path           text,
  cobranding          boolean not null default true,
  mode_famille_defaut boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.pro_sites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.pro_orgs(id) on delete cascade,
  nom        text not null default '',
  ville      text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pro_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.pro_orgs(id) on delete cascade,
  user_id    uuid not null,
  email      text not null default '',
  role       text not null default 'conseiller'
              check (role in ('owner', 'admin', 'conseiller', 'lecture')),
  statut     text not null default 'actif' check (statut in ('actif', 'suspendu')),
  site_id    uuid references public.pro_sites(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists pro_members_user_idx on public.pro_members (user_id) where statut = 'actif';

create table if not exists public.pro_invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.pro_orgs(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('owner', 'admin', 'conseiller', 'lecture')),
  jeton_hash  text not null unique,
  expire_le   timestamptz not null,
  acceptee_le timestamptz,
  cree_par    text not null default '',
  created_at  timestamptz not null default now()
);

-- ─── 2. Offres et réglages (valeurs TBD) ──────────────────────────────
create table if not exists public.pro_offers (
  id                text primary key,
  nom               text not null,
  description       text not null default '',
  price_cents       integer check (price_cents is null or price_cents >= 0),   -- tarif AGENCE : NULL = TBD
  prix_public_cents integer,                                                   -- tarif famille affiché sur le site
  devise            text not null default 'eur',
  actif             boolean not null default true,
  tbd               boolean not null default true,
  ordre             integer not null default 0
);

create table if not exists public.pro_settings (
  cle         text primary key,
  valeur      text,             -- NULL = à saisir par Maxime (TBD)
  tbd         boolean not null default true,
  description text not null default '',
  maj_par     text,
  maj_le      timestamptz not null default now()
);

-- ─── 3. Dossiers et contenus ──────────────────────────────────────────
create table if not exists public.pro_dossiers (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.pro_orgs(id) on delete restrict,
  site_id               uuid references public.pro_sites(id) on delete set null,
  reference             text not null unique,
  status                text not null default 'brouillon' check (status in (
                          'brouillon', 'complet', 'en_attente_paiement', 'paye', 'essai_accorde',
                          'paroles_en_cours', 'paroles_a_valider', 'musique_en_cours',
                          'controle_maison', 'livre', 'revision_demandee', 'echec', 'annule', 'rembourse')),
  paid                  boolean not null default false,
  mode                  text check (mode is null or mode in ('payant', 'essai')),
  offre_id              text references public.pro_offers(id),
  prenom_affiche        text not null default '',
  titre                 text not null default '',
  ceremonie_le          timestamptz,
  date_limite           timestamptz,
  audio_url             text not null default '',
  stripe_session_id     text,
  montant_cents         integer not null default 0,
  questionnaire_version integer not null default 0,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists pro_dossiers_org_idx on public.pro_dossiers (org_id, updated_at desc);
create index if not exists pro_dossiers_status_idx on public.pro_dossiers (status);

create table if not exists public.pro_questionnaires (
  id         bigint generated by default as identity primary key,
  dossier_id uuid not null references public.pro_dossiers(id) on delete cascade,
  version    integer not null,
  donnees    jsonb not null default '{}'::jsonb,
  auteur     uuid,
  created_at timestamptz not null default now(),
  unique (dossier_id, version)
);

create table if not exists public.pro_lyrics_versions (
  id             bigint generated by default as identity primary key,
  dossier_id     uuid not null references public.pro_dossiers(id) on delete cascade,
  version        integer not null,
  titre          text not null default '',
  paroles        text not null default '' check (char_length(paroles) <= 3000),
  prompt_musique text not null default '' check (char_length(prompt_musique) <= 500),
  auteur         text not null default 'agent' check (auteur in ('agent', 'conseiller', 'maison')),
  created_at     timestamptz not null default now(),
  unique (dossier_id, version)
);

create table if not exists public.pro_tracks (
  id            bigint generated by default as identity primary key,
  dossier_id    uuid not null references public.pro_dossiers(id) on delete cascade,
  version       integer not null default 1,
  chemin        text not null,            -- objet du bucket privé pro-audio
  duree_s       integer,
  mode          text not null default 'complet' check (mode in ('complet', 'essai', 'extrait')),
  valide_maison boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ─── 4. File de travaux, usage, journal ───────────────────────────────
create table if not exists public.pro_jobs (
  id              bigint generated by default as identity primary key,
  dossier_id      uuid not null references public.pro_dossiers(id) on delete cascade,
  type            text not null check (type in ('paroles', 'musique')),
  version         integer not null default 1,
  etat            text not null default 'a_faire' check (etat in ('a_faire', 'en_cours', 'fait', 'echec', 'bloque')),
  tentatives      integer not null default 0,
  prochain_essai  timestamptz not null default now(),
  verrou_jusqua   timestamptz,
  donnees         jsonb not null default '{}'::jsonb,
  derniere_erreur text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (dossier_id, type, version)           -- idempotence dossier + version
);
create index if not exists pro_jobs_prets_idx on public.pro_jobs (prochain_essai) where etat in ('a_faire', 'en_cours');

create table if not exists public.pro_usage (
  id          bigint generated by default as identity primary key,
  jour        date not null default current_date,
  dossier_id  uuid references public.pro_dossiers(id) on delete set null,
  type        text not null,
  fournisseur text not null default '',     -- interne : jamais affiché hors maison
  cout_cents  integer not null default 0,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists pro_usage_jour_idx on public.pro_usage (jour);

create table if not exists public.pro_audit (
  id         bigint generated by default as identity primary key,
  acteur     text not null default 'service',
  action     text not null,
  cible      text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pro_audit_date_idx on public.pro_audit (created_at desc);

-- ─── 5. Paiements, Stripe, promotions, essais ─────────────────────────
create table if not exists public.pro_payments (
  id                    bigint generated by default as identity primary key,
  dossier_id            uuid references public.pro_dossiers(id) on delete set null,
  org_id                uuid references public.pro_orgs(id) on delete set null,
  methode               text not null check (methode in ('stripe', 'code_maitre', 'essai')),
  statut                text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'expire', 'echec', 'rembourse')),
  montant_cents         integer not null default 0,
  devise                text not null default 'eur',
  stripe_session_id     text unique,
  stripe_payment_intent text,
  promo_code            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.pro_stripe_events (
  event_id text primary key,                   -- idempotence du webhook
  type     text not null,
  traite   boolean not null default false,
  recu_le  timestamptz not null default now()
);

create table if not exists public.pro_promo_codes (
  id                       bigint generated by default as identity primary key,
  code                     text not null,
  stripe_promotion_code_id text unique,
  pourcent_bp              integer,
  montant_cents            integer,
  actif                    boolean not null default true,
  expire_le                timestamptz,
  maj_le                   timestamptz not null default now()
);

create table if not exists public.pro_trials (
  id                 bigint generated by default as identity primary key,
  org_id             uuid not null references public.pro_orgs(id) on delete cascade,
  rang               integer not null default 1,
  dossier_id         uuid references public.pro_dossiers(id) on delete set null,
  empreinte_siret    text not null default '',
  empreinte_domaine  text not null default '',
  empreinte_tel      text not null default '',
  empreinte_appareil text not null default '',
  duree_s            integer,
  mode               text not null default 'complet',
  statut             text not null default 'accorde' check (statut in ('accorde', 'livre', 'refuse')),
  created_at         timestamptz not null default now(),
  unique (org_id, rang)                        -- un essai consommé deux fois : une seule insertion passe
);

-- ─── 6. QR et mémorial pro ────────────────────────────────────────────
create table if not exists public.pro_qr (
  id               bigint generated by default as identity primary key,
  dossier_id       uuid not null unique references public.pro_dossiers(id) on delete cascade,
  jeton            text not null unique check (jeton ~ '^[0-9A-HJKMNP-TV-Z]{10,12}$'),
  visibilite       text not null default 'lien' check (visibilite in ('public', 'lien', 'code', 'non')),
  code_hash        text,
  actif            boolean not null default false,
  scans            integer not null default 0,
  afficher_paroles boolean not null default false,
  mot_famille      text not null default '' check (char_length(mot_famille) <= 800),
  photo_path       text,
  options          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

-- ─── 7. Fonctions d'appartenance ──────────────────────────────────────
create or replace function app.mes_orgs() returns setof uuid
  language sql stable security definer set search_path = public as $$
    select org_id from public.pro_members where user_id = auth.uid() and statut = 'actif'
  $$;

create or replace function app.mon_role_pro(p_org uuid) returns text
  language sql stable security definer set search_path = public as $$
    select role from public.pro_members
     where user_id = auth.uid() and org_id = p_org and statut = 'actif' limit 1
  $$;

create or replace function app.pro_peut_ecrire(p_org uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select coalesce(app.mon_role_pro(p_org) in ('owner', 'admin', 'conseiller'), false)
  $$;

create or replace function app.pro_est_admin(p_org uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select coalesce(app.mon_role_pro(p_org) in ('owner', 'admin'), false)
  $$;

create or replace function app.pro_dossier_org(p_dossier uuid) returns uuid
  language sql stable security definer set search_path = public as $$
    select org_id from public.pro_dossiers where id = p_dossier
  $$;

-- Le service role (clé des fonctions Vercel) ou un administrateur de la base.
create or replace function app.pro_est_service() returns boolean
  language sql stable as $$
    select current_user in ('service_role', 'postgres', 'supabase_admin')
        or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
  $$;

-- ─── 8. Déclencheurs de garde (colonnes réservées au service) ─────────
create or replace function app.pro_garde_dossier() returns trigger
  language plpgsql as $$
begin
  if app.pro_est_service() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status <> 'brouillon' or new.paid or coalesce(new.audio_url, '') <> ''
       or new.stripe_session_id is not null or coalesce(new.montant_cents, 0) <> 0 then
      raise exception 'pro_dossiers : colonnes réservées au service' using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status or new.paid is distinct from old.paid
     or new.audio_url is distinct from old.audio_url or new.stripe_session_id is distinct from old.stripe_session_id
     or new.montant_cents is distinct from old.montant_cents or new.org_id is distinct from old.org_id
     or new.reference is distinct from old.reference then
    raise exception 'pro_dossiers : colonnes réservées au service' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists pro_dossiers_garde on public.pro_dossiers;
create trigger pro_dossiers_garde before insert or update on public.pro_dossiers
  for each row execute function app.pro_garde_dossier();

create or replace function app.pro_garde_qr() returns trigger
  language plpgsql as $$
begin
  if app.pro_est_service() then return new; end if;
  if new.actif is distinct from old.actif or new.scans is distinct from old.scans
     or new.jeton is distinct from old.jeton or new.dossier_id is distinct from old.dossier_id
     or new.code_hash is distinct from old.code_hash then
    raise exception 'pro_qr : colonnes réservées au service' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists pro_qr_garde on public.pro_qr;
create trigger pro_qr_garde before update on public.pro_qr
  for each row execute function app.pro_garde_qr();

-- Compteur d'ouvertures atomique, appelé par /api/pro/scan (clé de service).
create or replace function public.pro_compter_scan(p_jeton text) returns void
  language sql security definer set search_path = public as $$
    update public.pro_qr set scans = scans + 1 where jeton = p_jeton and actif
  $$;
revoke all on function public.pro_compter_scan(text) from public;
revoke all on function public.pro_compter_scan(text) from anon, authenticated;
grant execute on function public.pro_compter_scan(text) to service_role;

-- ─── 9. RLS ───────────────────────────────────────────────────────────
alter table public.pro_orgs           enable row level security;
alter table public.pro_sites          enable row level security;
alter table public.pro_members        enable row level security;
alter table public.pro_invitations    enable row level security;
alter table public.pro_offers         enable row level security;
alter table public.pro_settings       enable row level security;
alter table public.pro_dossiers       enable row level security;
alter table public.pro_questionnaires enable row level security;
alter table public.pro_lyrics_versions enable row level security;
alter table public.pro_tracks         enable row level security;
alter table public.pro_jobs           enable row level security;
alter table public.pro_usage          enable row level security;
alter table public.pro_audit          enable row level security;
alter table public.pro_payments       enable row level security;
alter table public.pro_stripe_events  enable row level security;
alter table public.pro_promo_codes    enable row level security;
alter table public.pro_trials         enable row level security;
alter table public.pro_qr             enable row level security;

-- Organisations : on voit les siennes ; la maison voit tout. Écritures : API.
drop policy if exists "pro_orgs_lecture" on public.pro_orgs;
create policy "pro_orgs_lecture" on public.pro_orgs for select to authenticated
  using (id in (select app.mes_orgs()) or app.est_maison());

drop policy if exists "pro_sites_lecture" on public.pro_sites;
create policy "pro_sites_lecture" on public.pro_sites for select to authenticated
  using (org_id in (select app.mes_orgs()) or app.est_maison());
drop policy if exists "pro_sites_admin" on public.pro_sites;
create policy "pro_sites_admin" on public.pro_sites for all to authenticated
  using (app.pro_est_admin(org_id)) with check (app.pro_est_admin(org_id));

drop policy if exists "pro_members_lecture" on public.pro_members;
create policy "pro_members_lecture" on public.pro_members for select to authenticated
  using (org_id in (select app.mes_orgs()) or app.est_maison());

drop policy if exists "pro_invitations_admin" on public.pro_invitations;
create policy "pro_invitations_admin" on public.pro_invitations for select to authenticated
  using (app.pro_est_admin(org_id) or app.est_maison());

drop policy if exists "pro_offers_lecture" on public.pro_offers;
create policy "pro_offers_lecture" on public.pro_offers for select to authenticated using (true);

drop policy if exists "pro_settings_maison" on public.pro_settings;
create policy "pro_settings_maison" on public.pro_settings for select to authenticated using (app.est_maison());

-- Dossiers : lecture par les membres ; création et retouche des champs
-- d'affichage par qui peut écrire. Statut, paiement, audio : service seul.
drop policy if exists "pro_dossiers_lecture" on public.pro_dossiers;
create policy "pro_dossiers_lecture" on public.pro_dossiers for select to authenticated
  using (org_id in (select app.mes_orgs()) or app.est_maison());
drop policy if exists "pro_dossiers_creation" on public.pro_dossiers;
create policy "pro_dossiers_creation" on public.pro_dossiers for insert to authenticated
  with check (app.pro_peut_ecrire(org_id) and status = 'brouillon' and not paid);
drop policy if exists "pro_dossiers_retouche" on public.pro_dossiers;
create policy "pro_dossiers_retouche" on public.pro_dossiers for update to authenticated
  using (app.pro_peut_ecrire(org_id)) with check (app.pro_peut_ecrire(org_id));

revoke update on public.pro_dossiers from anon, authenticated;
grant update (site_id, prenom_affiche, titre, ceremonie_le, date_limite, offre_id, updated_at)
  on public.pro_dossiers to authenticated;

drop policy if exists "pro_questionnaires_lecture" on public.pro_questionnaires;
create policy "pro_questionnaires_lecture" on public.pro_questionnaires for select to authenticated
  using (app.pro_dossier_org(dossier_id) in (select app.mes_orgs()) or app.est_maison());
drop policy if exists "pro_questionnaires_ecriture" on public.pro_questionnaires;
create policy "pro_questionnaires_ecriture" on public.pro_questionnaires for insert to authenticated
  with check (app.pro_peut_ecrire(app.pro_dossier_org(dossier_id)));

drop policy if exists "pro_lyrics_lecture" on public.pro_lyrics_versions;
create policy "pro_lyrics_lecture" on public.pro_lyrics_versions for select to authenticated
  using (app.pro_dossier_org(dossier_id) in (select app.mes_orgs()) or app.est_maison());

-- Pistes : l'agence ne voit que ce que la maison a validé.
drop policy if exists "pro_tracks_lecture" on public.pro_tracks;
create policy "pro_tracks_lecture" on public.pro_tracks for select to authenticated
  using ((valide_maison and app.pro_dossier_org(dossier_id) in (select app.mes_orgs())) or app.est_maison());

drop policy if exists "pro_jobs_lecture" on public.pro_jobs;
create policy "pro_jobs_lecture" on public.pro_jobs for select to authenticated
  using (app.pro_dossier_org(dossier_id) in (select app.mes_orgs()) or app.est_maison());

drop policy if exists "pro_payments_lecture" on public.pro_payments;
create policy "pro_payments_lecture" on public.pro_payments for select to authenticated
  using (app.pro_est_admin(org_id) or app.est_maison());

drop policy if exists "pro_qr_lecture" on public.pro_qr;
create policy "pro_qr_lecture" on public.pro_qr for select to authenticated
  using (app.pro_dossier_org(dossier_id) in (select app.mes_orgs()) or app.est_maison());
drop policy if exists "pro_qr_retouche" on public.pro_qr;
create policy "pro_qr_retouche" on public.pro_qr for update to authenticated
  using (app.pro_peut_ecrire(app.pro_dossier_org(dossier_id)))
  with check (app.pro_peut_ecrire(app.pro_dossier_org(dossier_id)));
revoke update on public.pro_qr from anon, authenticated;
grant update (visibilite, afficher_paroles, mot_famille) on public.pro_qr to authenticated;

-- Maison seule : usage, journal, essais, miroir des codes promo.
drop policy if exists "pro_usage_maison" on public.pro_usage;
create policy "pro_usage_maison" on public.pro_usage for select to authenticated using (app.est_maison());
drop policy if exists "pro_audit_maison" on public.pro_audit;
create policy "pro_audit_maison" on public.pro_audit for select to authenticated using (app.est_maison());
drop policy if exists "pro_trials_maison" on public.pro_trials;
create policy "pro_trials_maison" on public.pro_trials for select to authenticated using (app.est_maison());
drop policy if exists "pro_promo_maison" on public.pro_promo_codes;
create policy "pro_promo_maison" on public.pro_promo_codes for select to authenticated using (app.est_maison());
-- pro_stripe_events : aucune politique → aucun accès hors service role.

-- ─── 10. Stockage privé ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('pro-audio', 'pro-audio', false), ('pro-pieces', 'pro-pieces', false)
  on conflict (id) do nothing;

-- Les fichiers se lisent par URL signée émise par le serveur. En lecture
-- directe, un membre ne voit que le dossier de son organisation
-- (premier segment du chemin = org_id). Aucune écriture côté client.
drop policy if exists "pro_fichiers_lecture" on storage.objects;
create policy "pro_fichiers_lecture" on storage.objects for select to authenticated
  using (bucket_id in ('pro-audio', 'pro-pieces')
         and (split_part(name, '/', 1) in (select app.mes_orgs()::text) or app.est_maison()));

-- ─── 11. Valeurs initiales (TBD) ──────────────────────────────────────
insert into public.pro_settings (cle, valeur, tbd, description) values
  ('essai_par_org', '1', false, 'Compositions d''essai par agence — décidé par Maxime le 11/11/2026'),
  ('essai_duree_s', '150', false, 'Durée de la composition d''essai (2 min 30) — décidé le 11/11/2026'),
  ('essai_plafond_jour', null, true, 'Essais accordés au plus par jour, toutes agences (NULL : essais fermés)'),
  ('essai_mode', null, true, '« complet » ou « extrait » (défaut : complet)'),
  ('plafond_jour_cents', null, true, 'Plafond de dépense de génération par jour, en centimes (NULL : génération coupée)'),
  ('cout_estime_paroles_cents', null, true, 'Coût estimé d''une rédaction de paroles, en centimes'),
  ('cout_estime_musique_cents', null, true, 'Coût estimé d''une composition musicale, en centimes'),
  ('tva_bp', null, true, 'Taux de TVA en points de base (2000 = 20 %) ; NULL : franchise en base'),
  ('mention_tva', 'TVA non applicable, art. 293 B du CGI', false, 'Mention portée sur les factures en franchise'),
  ('job_tentatives_max', null, true, 'Tentatives avant échec d''un travail (défaut : 4)'),
  ('email_alerte', null, true, 'Adresse prévenue quand le plafond coupe la génération')
on conflict (cle) do nothing;

-- Tarifs AGENCE : NULL tant que Maxime ne les a pas fixés. Les prix publics
-- famille (149 / 299 / 499 €) sont ceux affichés sur le site.
insert into public.pro_offers (id, nom, description, price_cents, prix_public_cents, actif, tbd, ordre) values
  ('essentiel', 'Essentiel', 'L''hommage sobre et juste.', null, 14900, true, true, 1),
  ('prestige', 'Prestige', 'Une composition plus ample, le choix le plus fréquent.', null, 29900, true, true, 2),
  ('memorial', 'Mémorial', 'L''héritage sonore complet.', null, 49900, true, true, 3)
on conflict (id) do nothing;

-- ─── 12. Droits ───────────────────────────────────────────────────────
grant usage on schema app to authenticated;
grant execute on function app.mes_orgs(), app.mon_role_pro(uuid), app.pro_peut_ecrire(uuid),
  app.pro_est_admin(uuid), app.pro_dossier_org(uuid) to authenticated;

-- ─── 13. Realtime (statut des dossiers) ───────────────────────────────
-- À exécuter à la main si la publication existe (Supabase la crée) :
--   alter publication supabase_realtime add table public.pro_dossiers;
-- Sans Realtime, la console sonde /api/pro/job-tick toutes les 15 secondes.

-- ─── RETOUR ARRIÈRE (à n'exécuter qu'en connaissance de cause) ────────
-- drop policy if exists "pro_fichiers_lecture" on storage.objects;
-- delete from storage.buckets where id in ('pro-audio', 'pro-pieces');  -- seulement s'ils sont vides
-- drop function if exists public.pro_compter_scan(text);
-- drop table if exists public.pro_qr, public.pro_trials, public.pro_promo_codes,
--   public.pro_stripe_events, public.pro_payments, public.pro_audit, public.pro_usage,
--   public.pro_jobs, public.pro_tracks, public.pro_lyrics_versions, public.pro_questionnaires,
--   public.pro_dossiers, public.pro_settings, public.pro_offers, public.pro_invitations,
--   public.pro_members, public.pro_sites, public.pro_orgs cascade;
-- drop function if exists app.pro_garde_qr(), app.pro_garde_dossier(), app.pro_est_service(),
--   app.pro_dossier_org(uuid), app.pro_est_admin(uuid), app.pro_peut_ecrire(uuid),
--   app.mon_role_pro(uuid), app.mes_orgs();
