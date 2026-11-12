-- ═══════════════════════════════════════════════════════════════
-- Migration 12 — Un même courriel ne part pas deux fois en 60 jours
--
-- NON appliquée automatiquement — attend l'accord du fondateur.
-- Idempotente (rejouable). Aucune valeur secrète.
--
-- RÈGLE (décision du fondateur) : le même modèle / la même campagne / la
-- même étape de séquence ne peut pas être remis deux fois à la même
-- adresse normalisée (lower(btrim(email))) pendant 60 jours. Passé ce
-- délai, un nouvel envoi est permis (nouvelle ligne : l'historique n'est
-- jamais réécrit).
--
-- Une contrainte UNIQUE simple ne sait pas dire « 60 jours glissants ».
-- Le modèle est donc le suivant, en DEUX couches :
--
--   1. public.reserver_envois(jsonb)  — LE chemin de l'API.
--      Une transaction : verrou consultatif (pg_advisory_xact_lock) sur un
--      hash stable de la clé, SELECT des envois bloquants des 60 derniers
--      jours, INSERT d'une ligne « reserve » s'il n'y en a pas. Deux
--      requêtes simultanées pour la même clé s'enchaînent : la seconde voit
--      la ligne de la première et répond « déjà envoyé » (avec la date du
--      précédent et la date de renvoi possible).
--
--   2. Une contrainte d'EXCLUSION (btree_gist) : deux lignes bloquantes de
--      même clé ne peuvent pas avoir des fenêtres [envoye_le, +60 j)
--      qui se chevauchent. Même un INSERT direct qui contournerait la
--      fonction, ou deux transactions que le verrou ne séparerait pas,
--      sont refusés par Postgres (23P01). La fonction rattrape cette
--      erreur et répond « déjà envoyé ».
--
-- cle_idempotence = lower(destinataire) || '|' || portée, construite par
-- api/_envoi-unique.js (cleEnvoi) :
--     m:<modèle>  |  c:<campagne>  |  o:<objet>   [+ #e<étape>]
-- Foo@Bar.com et foo@bar.com : même clé. Les envois de test (mode 'test')
-- n'ont pas de clé : ils restent répétables.
--
-- Statuts ajoutés :
--   reserve    clé prise, envoi en cours (bloque pendant la fenêtre)
--   incertain  délai dépassé chez le prestataire : on ne sait pas si c'est
--              parti → bloque le renvoi, à vérifier dans Resend
--   echec      échec net : la ligne ne bloque plus, un nouvel essai est
--              permis tout de suite
-- Les autres statuts bloquants : envoye, delivre, ouvert, clique, differe,
-- rejete, plainte.
--
-- Sans cette migration, l'API retombe sur un mode dégradé (verrou en
-- mémoire de l'instance + lecture du journal sur 60 jours) : pas atomique
-- entre instances. Avec elle, la fenêtre est garantie par la base.
--
-- La durée (60 jours = 1440 heures) est écrite à deux endroits SQL
-- (trigger + fonction) et dans api/_envoi-unique.js (FENETRE_JOURS).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists btree_gist;

alter table public.envois_prospect add column if not exists cle_idempotence text;
alter table public.envois_prospect add column if not exists campagne text not null default '';
alter table public.envois_prospect add column if not exists sequence_id bigint;
alter table public.envois_prospect add column if not exists etape int;
alter table public.envois_prospect add column if not exists variante text not null default '';
-- Fin de la fenêtre de blocage : envoye_le + 60 jours (posée par le trigger).
alter table public.envois_prospect add column if not exists bloque_jusqua timestamptz;

-- Statuts : réserve / incertain / échec s'ajoutent aux précédents.
alter table public.envois_prospect drop constraint if exists envois_prospect_statut_check;
alter table public.envois_prospect add constraint envois_prospect_statut_check
  check (statut in ('reserve', 'incertain', 'echec',
                    'envoye', 'delivre', 'ouvert', 'clique', 'rejete', 'plainte', 'differe'));

-- La clé est toujours en minuscules : une clé mal formée contournerait la fenêtre.
alter table public.envois_prospect drop constraint if exists envois_prospect_cle_minuscules;
alter table public.envois_prospect add constraint envois_prospect_cle_minuscules
  check (cle_idempotence is null or cle_idempotence = lower(cle_idempotence));

-- Fin de fenêtre = début + 60 jours (1440 h : indépendant du fuseau).
create or replace function public.envois_prospect_fenetre()
returns trigger language plpgsql as $$
begin
  new.bloque_jusqua := new.envoye_le + interval '1440 hours';
  return new;
end $$;

drop trigger if exists envois_prospect_fenetre_trg on public.envois_prospect;
create trigger envois_prospect_fenetre_trg
  before insert or update of envoye_le on public.envois_prospect
  for each row execute function public.envois_prospect_fenetre();

update public.envois_prospect
   set bloque_jusqua = envoye_le + interval '1440 hours'
 where bloque_jusqua is null;

-- Un ancien essai de la migration « à vie » (index unique plein) ne doit pas subsister.
drop index if exists public.envois_prospect_cle_idempotence_uidx;

-- Reprise de l'existant : seuls comptent les envois des 60 derniers jours.
-- Par (destinataire, portée), la ligne la PLUS RÉCENTE porte la clé : elle
-- bloque jusqu'à sa propre échéance (les plus anciennes expireraient avant).
-- Les lignes de plus de 60 jours, et les doublons historiques, gardent leur
-- trace mais sans clé : ils ne bloquent rien et ne sont pas supprimés.
with candidats as (
  select id,
         lower(btrim(destinataire)) || '|' ||
           case when btrim(modele) <> '' then 'm:' || lower(btrim(modele))
                else 'o:' || left(lower(btrim(regexp_replace(sujet, '\s+', ' ', 'g'))), 120) end as cle,
         row_number() over (
           partition by lower(btrim(destinataire)) || '|' ||
             case when btrim(modele) <> '' then 'm:' || lower(btrim(modele))
                  else 'o:' || left(lower(btrim(regexp_replace(sujet, '\s+', ' ', 'g'))), 120) end
           order by envoye_le desc, id desc) as rang
    from public.envois_prospect
   where mode = 'envoi'
     and cle_idempotence is null
     and statut in ('envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte', 'incertain', 'reserve')
     and envoye_le > now() - interval '1440 hours'
)
update public.envois_prospect e
   set cle_idempotence = c.cle
  from candidats c
 where e.id = c.id and c.rang = 1
   -- Rejeu après mise en service : si la clé existe déjà sur une ligne bloquante
   -- (posée par l'API), l'historique ne la lui dispute pas.
   and not exists (
     select 1 from public.envois_prospect k
      where k.cle_idempotence = c.cle
        and k.statut in ('reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'));

-- Index de lecture de la fenêtre.
create index if not exists envois_prospect_cle_fenetre_idx
  on public.envois_prospect (cle_idempotence, envoye_le desc)
  where cle_idempotence is not null;

-- Couche 2 : pas deux fenêtres bloquantes qui se chevauchent pour une même clé.
alter table public.envois_prospect drop constraint if exists envois_prospect_fenetre_excl;
alter table public.envois_prospect add constraint envois_prospect_fenetre_excl
  exclude using gist (cle_idempotence with =, tstzrange(envoye_le, bloque_jusqua) with &&)
  where (cle_idempotence is not null
         and statut in ('reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte'));

create index if not exists envois_prospect_seq_idx
  on public.envois_prospect (sequence_id, etape)
  where sequence_id is not null;

-- Couche 1 : la réservation, seul chemin de l'API.
-- p_lignes : tableau JSON de lignes { cle_idempotence, collaborateur, mode,
-- destinataire, sujet, modele, ref, societe, piece_jointe, campagne,
-- sequence_id, etape }. Réponse : un objet par clé, dans l'ordre des
-- clés :   { cle, ok:true, id }
--       |  { cle, ok:false, deja:<statut>, precedent:<date>, renvoi:<date> }
-- p_maintenant : horloge injectable, UNIQUEMENT pour les preuves ; l'API
-- ne le fournit pas (now()).
create or replace function public.reserver_envois(p_lignes jsonb, p_maintenant timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l jsonb;
  v_cle text;
  v_now timestamptz := coalesce(p_maintenant, now());
  ex record;
  v_id bigint;
  res jsonb := '[]'::jsonb;
begin
  -- Ordre de verrouillage stable (deux lots croisés ne s'interbloquent pas).
  for l in select e from jsonb_array_elements(p_lignes) e order by e->>'cle_idempotence' loop
    v_cle := lower(btrim(l->>'cle_idempotence'));
    if v_cle is null or v_cle = '' then
      raise exception 'cle_idempotence obligatoire';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(v_cle, 0));

    select id, statut, envoye_le into ex
      from public.envois_prospect
     where cle_idempotence = v_cle
       and statut in ('reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte')
       and envoye_le > v_now - interval '1440 hours'
     order by envoye_le desc
     limit 1;

    if found then
      res := res || jsonb_build_object('cle', v_cle, 'ok', false, 'deja', ex.statut,
               'precedent', ex.envoye_le, 'renvoi', ex.envoye_le + interval '1440 hours');
      continue;
    end if;

    begin
      insert into public.envois_prospect
        (collaborateur, mode, destinataire, sujet, modele, ref, societe, piece_jointe,
         campagne, sequence_id, etape, cle_idempotence, statut, envoye_le)
      values
        (coalesce(l->>'collaborateur', ''), coalesce(nullif(l->>'mode', ''), 'envoi'),
         coalesce(l->>'destinataire', ''), coalesce(l->>'sujet', ''), coalesce(l->>'modele', ''),
         coalesce(l->>'ref', ''), coalesce(l->>'societe', ''), coalesce(l->>'piece_jointe', ''),
         coalesce(l->>'campagne', ''), nullif(l->>'sequence_id', '')::bigint, nullif(l->>'etape', '')::int,
         v_cle, 'reserve', v_now)
      returning id into v_id;
      res := res || jsonb_build_object('cle', v_cle, 'ok', true, 'id', v_id);
    exception when exclusion_violation then
      -- Filet : la contrainte a refusé ce que le verrou n'a pas séparé.
      select id, statut, envoye_le into ex
        from public.envois_prospect
       where cle_idempotence = v_cle
         and statut in ('reserve', 'incertain', 'envoye', 'delivre', 'ouvert', 'clique', 'differe', 'rejete', 'plainte')
       order by envoye_le desc
       limit 1;
      res := res || jsonb_build_object('cle', v_cle, 'ok', false, 'deja', coalesce(ex.statut, 'envoye'),
               'precedent', ex.envoye_le, 'renvoi', ex.envoye_le + interval '1440 hours');
    end;
  end loop;
  return res;
end $$;

-- Seul le serveur (clé de service) l'appelle.
revoke all on function public.reserver_envois(jsonb, timestamptz) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.reserver_envois(jsonb, timestamptz) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.reserver_envois(jsonb, timestamptz) from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.reserver_envois(jsonb, timestamptz) to service_role;
  end if;
end $$;
