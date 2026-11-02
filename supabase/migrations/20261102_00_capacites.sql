-- ═══════════════════════════════════════════════════════════════
-- Drapeau lu par le site : quelles migrations sont réellement en place.
--
-- Le site appelle public.melodia_capacites() au démarrage. Tant que
-- cette fonction n'existe pas, il se comporte comme aujourd'hui
-- (aucune colonne nouvelle n'est écrite). La fonction ne renvoie pas
-- de données de familles : seulement des oui/non, calculés sur le
-- catalogue. On peut donc l'appliquer seule, avant les autres.
--
-- ORDRE COMPLET (ne rien appliquer sur le projet live depuis cet
-- agent ; à passer dans le SQL Editor, dans cet ordre) :
--   1. 20261102_00_capacites.sql          drapeau, sans effet visible
--   2. 20261102_01_s1_est_maison.sql      S1
--   3. 20261102_02_s2_orders_insert.sql   S2
--   4. 20261102_03_b1_prospects.sql       B1
--   5. 20261102_04_s4_adieux.sql          S4
--   6. 20261102_05_parrain.sql            parrain
--   7. 20261102_06_s6_limite.sql          plafond d'appels
--   8. 20261102_07_s7_email_lower.sql     S7
-- ═══════════════════════════════════════════════════════════════

create or replace function public.melodia_capacites()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'prospects_relance_le', exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'prospects'
         and column_name = 'relance_le'
    ),
    'prospects_cle_owner', exists (
      select 1 from pg_indexes
       where schemaname = 'public' and indexname = 'prospects_owner_siret_uidx'
    ),
    'orders_parrain', exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'orders'
         and column_name = 'parrain'
    ),
    'limite_persistante', exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'melodia_trop_souvent'
    )
  );
$$;

revoke all on function public.melodia_capacites() from public;
grant execute on function public.melodia_capacites() to anon, authenticated;
