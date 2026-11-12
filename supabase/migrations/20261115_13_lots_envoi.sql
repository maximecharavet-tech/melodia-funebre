-- ═══════════════════════════════════════════════════════════════
-- Migration 13 — Envoi groupé : lots et file d'envoi persistés
--
-- NON appliquée automatiquement — attend l'accord du fondateur.
-- Idempotente (rejouable). Aucune valeur secrète.
--
-- Un « lot » est une sélection de destinataires + un modèle, lancée d'un
-- seul clic dans la console. Chaque destinataire est une ligne de la file
-- (lots_envoi_items) ; /api/prospect-mail (modes lot_*) les traite un par
-- un, dans les plafonds Resend (100/jour, 3 000/mois), par le MÊME chemin
-- que l'envoi unitaire (réservation d'idempotence sur 60 jours, désabonnés
-- écartés, rôle relu en base). Le lot survit au rechargement de la page :
-- la console relit son état ici.
--
-- Ces tables sont distinctes de envois_prospect (le journal des courriels
-- réellement envoyés, migration 12). RLS activée, AUCUNE policy : seul le
-- serveur (clé de service) y accède.
--
-- Sans cette migration, l'API garde le lot en mémoire de l'instance
-- (mode dégradé : le lot n'est pas partagé entre instances, et se perd au
-- redémarrage) ; la console en garde aussi une copie locale.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.lots_envoi (
  id           bigserial primary key,
  proprietaire text        not null,
  modele       text        not null,
  options      jsonb       not null default '{}'::jsonb,
  statut       text        not null default 'en_cours'
                 check (statut in ('en_cours', 'termine', 'quota', 'arrete', 'annule')),
  note         text        not null default '',
  total        int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists lots_envoi_proprietaire_idx on public.lots_envoi (lower(proprietaire), created_at desc);
-- Un seul lot en cours par collaborateur (le double clic sur « Envoyer » ne crée pas deux lots).
create unique index if not exists lots_envoi_un_en_cours_uidx
  on public.lots_envoi (lower(proprietaire)) where statut = 'en_cours';

create table if not exists public.lots_envoi_items (
  id           bigserial primary key,
  lot_id       bigint      not null references public.lots_envoi(id) on delete cascade,
  rang         int         not null,
  email        text        not null,
  prenom       text        not null default '',
  nom_famille  text        not null default '',
  civilite     text        not null default '',
  organisation text        not null default '',
  ville        text        not null default '',
  ref          text        not null default '',
  statut       text        not null default 'attente'
                 check (statut in ('attente', 'en_cours', 'envoye', 'deja', 'desabonne', 'erreur', 'reporte', 'ignore')),
  code         text        not null default '',
  detail       text        not null default '',
  retentable   boolean     not null default false,
  precedent    timestamptz,
  renvoi       timestamptz,
  resend_id    text,
  traite_le    timestamptz
);
create index if not exists lots_envoi_items_lot_idx on public.lots_envoi_items (lot_id, rang);
create index if not exists lots_envoi_items_statut_idx on public.lots_envoi_items (lot_id, statut);

alter table public.lots_envoi enable row level security;
alter table public.lots_envoi_items enable row level security;
revoke all on table public.lots_envoi, public.lots_envoi_items from anon, authenticated;
revoke all on sequence public.lots_envoi_id_seq, public.lots_envoi_items_id_seq from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.lots_envoi, public.lots_envoi_items to service_role;
    grant usage, select on sequence public.lots_envoi_id_seq, public.lots_envoi_items_id_seq to service_role;
  end if;
end $$;
