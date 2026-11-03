-- ═══════════════════════════════════════════════════════════════
-- S8 — Journal des courriels de prospection (quota quotidien)
--
-- /api/prospect-mail plafonne l'envoi : 30 courriels de prospection
-- par jour (jour de Paris) pour un collaborateur « commercial », 100
-- pour le fondateur, et 10 tests par jour. Le compte doit tenir entre
-- les instances Vercel : il se lit ici.
--
-- Une ligne par destinataire réellement remis à Resend. Le même
-- journal sert à ne jamais renvoyer le même modèle au même
-- destinataire le même jour.
--
-- RLS activée et AUCUNE policy : le navigateur (anon, authenticated)
-- ne lit ni n'écrit rien. Seule la fonction serveur, avec la clé de
-- service (SUPABASE_SERVICE_ROLE_KEY), y accède — service_role
-- contourne la RLS. Tant que cette table n'existe pas, l'API retombe
-- sur un plafond par appel et par instance (voir prospect-mail.js).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.envois_prospect (
  id            bigserial primary key,
  collaborateur text        not null,
  destinataire  text        not null,
  sujet         text        not null default '',
  modele        text        not null default '',
  mode          text        not null default 'envoi' check (mode in ('envoi', 'test')),
  ref           text        not null default '',
  resend_id     text,
  envoye_le     timestamptz not null default now()
);

create index if not exists envois_prospect_collab_jour_idx
  on public.envois_prospect (lower(collaborateur), envoye_le desc);
create index if not exists envois_prospect_dest_idx
  on public.envois_prospect (lower(destinataire), envoye_le desc);

alter table public.envois_prospect enable row level security;

revoke all on table public.envois_prospect from anon, authenticated;
revoke all on sequence public.envois_prospect_id_seq from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert on table public.envois_prospect to service_role;
    grant usage, select on sequence public.envois_prospect_id_seq to service_role;
  end if;
end $$;
