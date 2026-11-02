-- ═══════════════════════════════════════════════════════════════
-- S6 — Plafond d'appels persistant, dans la table rate_limits
-- déjà présente sur le live (bucket, key, window_start, count).
--
-- La fonction n'est exécutable que par service_role : le navigateur
-- ne peut pas s'en servir pour gonfler ou lire les compteurs.
-- Tant qu'elle n'existe pas, les fonctions /api retombent sur le
-- compteur en mémoire de l'instance (pas d'erreur 500).
--
-- Le seau utilisé est « melodia », pour ne pas mélanger ces compteurs
-- avec d'autres produits qui partagent la même table.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.melodia_trop_souvent(
  p_cle text,
  p_max integer,
  p_fenetre_ms bigint
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fenetre bigint;
  v_n integer;
begin
  if p_cle is null or length(btrim(p_cle)) = 0 then
    return false;
  end if;
  if p_max is null or p_max < 1 then
    p_max := 1;
  end if;
  if p_fenetre_ms is null or p_fenetre_ms < 1000 then
    p_fenetre_ms := 1000;
  end if;

  v_fenetre := (floor(extract(epoch from clock_timestamp()) * 1000 / p_fenetre_ms) * p_fenetre_ms)::bigint;

  insert into public.rate_limits as r (bucket, key, window_start, count)
  values ('melodia', left(p_cle, 200), v_fenetre, 1)
  on conflict (bucket, key, window_start)
  do update set count = r.count + 1
  returning count into v_n;

  return v_n > p_max;
end;
$$;

revoke all on function public.melodia_trop_souvent(text, integer, bigint) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.melodia_trop_souvent(text, integer, bigint) to service_role;
  end if;
end $$;
