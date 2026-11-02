-- ═══════════════════════════════════════════════════════════════
-- B1 — Le carnet de prospects accepte ce que la console écrit.
--
-- Le live n'a que « relance » (timestamptz). Le code écrit
-- relance_le, oppose, dernier_contact, dirigeant, et l'annuaire
-- ajoute departement, effectif, creation, etablissements, agence.
-- Résultat : chaque sauvegarde est refusée, le carnet reste vide.
--
-- « relance » est conservée. Les dates déjà saisies sont recopiées
-- dans relance_le. La clé unique passe de siret seul à (owner, siret) :
-- deux commerciaux peuvent suivre la même enseigne. L'ancienne clé
-- primaire sur siret est remplacée par un identifiant technique,
-- une seule fois (le bloc ne refait rien si c'est déjà fait).
-- ═══════════════════════════════════════════════════════════════

alter table public.prospects
  add column if not exists relance_le date,
  add column if not exists oppose boolean not null default false,
  add column if not exists dernier_contact timestamptz,
  add column if not exists dirigeant text not null default '',
  add column if not exists departement text not null default '',
  add column if not exists effectif text not null default '',
  add column if not exists creation text not null default '',
  add column if not exists etablissements integer,
  add column if not exists agence boolean not null default false;

update public.prospects
   set relance_le = (relance at time zone 'Europe/Paris')::date
 where relance is not null
   and relance_le is null;

do $$
declare
  cols text;
begin
  select string_agg(a.attname, ',' order by k.ord)
    into cols
    from pg_constraint c
    join lateral unnest(c.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = k.attnum
   where c.conrelid = 'public.prospects'::regclass
     and c.contype = 'p';

  if cols = 'siret' then
    alter table public.prospects drop constraint prospects_pkey;
    alter table public.prospects
      add column id bigint generated always as identity primary key;
  elsif cols is null then
    if not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'prospects'
         and column_name = 'id'
    ) then
      alter table public.prospects
        add column id bigint generated always as identity;
    end if;
    alter table public.prospects add primary key (id);
  end if;
end $$;

create unique index if not exists prospects_owner_siret_uidx
  on public.prospects (owner, siret);
