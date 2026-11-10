-- ═══════════════════════════════════════════════════════════════
-- S8 — Journal des courriels de prospection (quota + suivi)
--
-- /api/prospect-mail plafonne l'envoi : 30 courriels de prospection
-- par jour (jour de Paris) pour un collaborateur « commercial », 100
-- pour le fondateur, et 10 tests par jour. Le compte doit tenir entre
-- les instances Vercel : il se lit ici.
--
-- Une ligne par destinataire réellement remis à Resend. Le même
-- journal sert à ne jamais renvoyer le même modèle au même
-- destinataire le même jour, et à afficher le suivi (envoyé,
-- délivré, ouvert, cliqué, rejeté) alimenté par le webhook
-- /api/prospect-webhook.
--
-- RLS activée et AUCUNE policy : le navigateur (anon, authenticated)
-- ne lit ni n'écrit rien. Seule la fonction serveur, avec la clé de
-- service (SUPABASE_SERVICE_ROLE_KEY), y accède — service_role
-- contourne la RLS. Tant que cette table n'existe pas, l'API retombe
-- sur un plafond par appel et par instance (voir prospect-mail.js).
--
-- Cette migration n'est PAS appliquée automatiquement. Elle attend
-- l'accord du fondateur.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.envois_prospect (
  id            bigserial primary key,
  collaborateur text        not null,
  destinataire  text        not null,
  sujet         text        not null default '',
  modele        text        not null default '',
  mode          text        not null default 'envoi' check (mode in ('envoi', 'test')),
  ref           text        not null default '',
  societe       text        not null default '',
  piece_jointe  text        not null default '',
  resend_id     text,
  statut        text        not null default 'envoye'
                  check (statut in ('envoye', 'delivre', 'ouvert', 'clique', 'rejete', 'plainte', 'differe')),
  dernier_evenement text,
  ouvert_nb     integer     not null default 0,
  clique_nb     integer     not null default 0,
  envoye_le     timestamptz not null default now(),
  delivre_le    timestamptz,
  ouvert_le     timestamptz,
  clique_le     timestamptz,
  rejete_le     timestamptz
);

create index if not exists envois_prospect_collab_jour_idx
  on public.envois_prospect (lower(collaborateur), envoye_le desc);
create index if not exists envois_prospect_dest_idx
  on public.envois_prospect (lower(destinataire), envoye_le desc);
create index if not exists envois_prospect_resend_idx
  on public.envois_prospect (resend_id)
  where resend_id is not null;

alter table public.envois_prospect enable row level security;

revoke all on table public.envois_prospect from anon, authenticated;
revoke all on sequence public.envois_prospect_id_seq from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update on table public.envois_prospect to service_role;
    grant usage, select on sequence public.envois_prospect_id_seq to service_role;
  end if;
end $$;
