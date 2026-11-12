-- ═══════════════════════════════════════════════════════════════
-- Migration 12 — Un même courriel ne part jamais deux fois
--
-- NON appliquée automatiquement — attend l'accord du fondateur.
-- Idempotente (rejouable). Aucune valeur secrète.
--
-- /api/prospect-mail et /api/sequences-cron réservent une ligne dans
-- public.envois_prospect AVANT d'appeler Resend (INSERT … ON CONFLICT DO
-- NOTHING sur cle_idempotence) : deux requêtes simultanées pour le même
-- destinataire et le même modèle / campagne / étape → une seule gagne
-- l'insertion, une seule appelle Resend.
--
-- cle_idempotence = lower(destinataire) || '|' || portée, construite par
-- api/_envoi-unique.js (cleEnvoi) :
--     m:<modèle>  |  c:<campagne>  |  o:<objet>   [+ #e<étape>]
-- Foo@Bar.com et foo@bar.com : même clé. Les envois de test (mode 'test')
-- n'ont pas de clé : ils restent répétables.
--
-- Statuts ajoutés :
--   reserve    clé prise, envoi en cours (bloque les doublons)
--   incertain  délai dépassé chez le prestataire : on ne sait pas si c'est
--              parti → bloque le renvoi, à vérifier dans Resend
--   echec      échec net : la clé est retirée, un nouvel essai est permis
--
-- Sans cette migration, l'API retombe sur un mode dégradé (verrou en
-- mémoire de l'instance + lecture du journal) : pas atomique entre
-- instances. Avec elle, l'unicité est garantie par la base.
-- ═══════════════════════════════════════════════════════════════

alter table public.envois_prospect add column if not exists cle_idempotence text;
alter table public.envois_prospect add column if not exists campagne text not null default '';
alter table public.envois_prospect add column if not exists sequence_id bigint;
alter table public.envois_prospect add column if not exists etape int;
alter table public.envois_prospect add column if not exists variante text not null default '';

-- Statuts : réserve / incertain / échec s'ajoutent aux précédents.
alter table public.envois_prospect drop constraint if exists envois_prospect_statut_check;
alter table public.envois_prospect add constraint envois_prospect_statut_check
  check (statut in ('reserve', 'incertain', 'echec',
                    'envoye', 'delivre', 'ouvert', 'clique', 'rejete', 'plainte', 'differe'));

-- Reprise de l'existant : une clé par (destinataire, portée), portée par
-- la ligne la plus ancienne ; les doublons historiques gardent leur
-- trace mais sans clé (ils ne bloquent rien, ils ne sont pas supprimés).
with candidats as (
  select id,
         lower(btrim(destinataire)) || '|' ||
           case when btrim(modele) <> '' then 'm:' || lower(btrim(modele))
                else 'o:' || left(lower(btrim(regexp_replace(sujet, '\s+', ' ', 'g'))), 120) end as cle,
         row_number() over (
           partition by lower(btrim(destinataire)) || '|' ||
             case when btrim(modele) <> '' then 'm:' || lower(btrim(modele))
                  else 'o:' || left(lower(btrim(regexp_replace(sujet, '\s+', ' ', 'g'))), 120) end
           order by envoye_le, id) as rang
    from public.envois_prospect
   where mode = 'envoi'
     and cle_idempotence is null
     and statut not in ('echec')
)
update public.envois_prospect e
   set cle_idempotence = c.cle
  from candidats c
 where e.id = c.id and c.rang = 1;

-- L'unicité elle-même. Index plein (pas partiel) : PostgREST s'en sert
-- pour « on_conflict=cle_idempotence ». Les NULL ne se contraignent pas.
create unique index if not exists envois_prospect_cle_idempotence_uidx
  on public.envois_prospect (cle_idempotence);

-- La clé est toujours en minuscules : une clé mal formée contournerait l'unicité.
alter table public.envois_prospect drop constraint if exists envois_prospect_cle_minuscules;
alter table public.envois_prospect add constraint envois_prospect_cle_minuscules
  check (cle_idempotence is null or cle_idempotence = lower(cle_idempotence));

create index if not exists envois_prospect_seq_idx
  on public.envois_prospect (sequence_id, etape)
  where sequence_id is not null;
