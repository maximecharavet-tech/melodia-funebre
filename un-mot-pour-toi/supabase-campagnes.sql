-- ═══════════════════════════════════════════════════════════════
-- UN MOT POUR TOI — les campagnes
--
-- Jusqu'ici, chaque message vivait seul : on déposait, on obtenait
-- un QR, fin. Une carte de départ ne marche pas comme ça. Quinze
-- personnes signent LA MÊME carte, et celle qui part la reçoit
-- entière.
--
-- D'où deux adresses par personne qui s'en va, et pas une seule :
--
--   /pour/<prénom>     ce que scannent les collègues pour déposer
--   /carte/<jeton>     ce que scanne celle qui part, et qui montre
--                      tous les messages d'un coup
--
-- POURQUOI LA CARTE A SON PROPRE JETON SECRET
--
-- L'adresse de dépôt est faite pour être devinée : elle est imprimée
-- sur une affiche, on la tape, on la dit à voix haute. Si la carte
-- collective s'ouvrait par ce même mot, n'importe qui tapant
-- « /carte/chloe » lirait les quinze messages avant l'intéressée —
-- et gâcherait la surprise que toute l'affaire cherche à faire.
--
-- Le jeton de carte est donc tiré au hasard, séparé, et ne sort
-- jamais de la fonction « campagne() » que consulte la page de
-- dépôt. Un collègue qui ouvre les outils de développement sur la
-- page de dépôt ne le trouve pas : il n'y est pas.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.campagnes (
  slug         text primary key,
  nom          text not null,
  sous_titre   text not null default '',
  intro        text not null default '',
  affiche      text,                      -- chemin de l'image, sans la largeur
  affiche_alt  text not null default '',
  jeton_carte  text not null unique,
  actif        boolean not null default true,
  cree_le      timestamptz not null default now(),
  constraint campagnes_slug_forme   check (slug ~ '^[a-z0-9-]{2,40}$'),
  constraint campagnes_carte_long   check (char_length(jeton_carte) = 22)
);

alter table public.campagnes enable row level security;
revoke all on public.campagnes from anon, authenticated;

-- Le rattachement d'un message à une campagne. Nullable : le studio
-- générique (/un-mot-pour-toi/) continue de fonctionner sans campagne,
-- et ces messages-là n'apparaissent sur aucune carte collective.
alter table public.adieux
  add column if not exists campagne text
  references public.campagnes (slug) on delete set null;

create index if not exists adieux_campagne_idx
  on public.adieux (campagne, cree_le)
  where campagne is not null;


-- ─── Ce que la page de dépôt a le droit de savoir ───
-- Tout sauf le jeton de carte. La liste des colonnes est écrite en
-- toutes lettres exprès : un « select * » ici ferait fuiter le jeton
-- le jour où quelqu'un ajoute une colonne sans y penser.
create or replace function public.campagne(s text)
returns table (
  slug text, nom text, sous_titre text, intro text,
  affiche text, affiche_alt text, messages integer
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if s is null or s !~ '^[a-z0-9-]{2,40}$' then return; end if;
  return query
    select c.slug, c.nom, c.sous_titre, c.intro, c.affiche, c.affiche_alt,
           (select count(*)::int from public.adieux a
             where a.campagne = c.slug and a.actif)
      from public.campagnes c
     where c.slug = s and c.actif;
end $$;


-- ─── La carte collective ───
-- Une seule fonction, un seul aller-retour : l'en-tête et tous les
-- messages ensemble. Le jeton de carte est exigé en entier.
create or replace function public.carte(c text)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_campagne public.campagnes%rowtype;
begin
  if c is null or char_length(c) <> 22 then return null; end if;

  select * into v_campagne from public.campagnes where jeton_carte = c and actif;
  if not found then return null; end if;

  return json_build_object(
    'nom',         v_campagne.nom,
    'sous_titre',  v_campagne.sous_titre,
    'affiche',     v_campagne.affiche,
    'affiche_alt', v_campagne.affiche_alt,
    'messages', coalesce((
      select json_agg(m order by m.cree_le)
        from (
          select a.jeton, a.auteur, a.mot, a.media_type, a.media_url,
                 a.media_mime, a.cree_le
            from public.adieux a
           where a.campagne = v_campagne.slug and a.actif
           order by a.cree_le
        ) m
    ), '[]'::json)
  );
end $$;


-- ─── Le dépôt, désormais rattachable à une campagne ───
-- L'ancienne signature à six arguments est remplacée plutôt que
-- doublée : deux fonctions de même nom, l'une à six arguments et
-- l'autre à sept, rendent l'appel ambigu côté PostgREST. Le septième
-- argument a une valeur par défaut, donc les appels à six arguments
-- nommés continuent de passer tels quels.
drop function if exists public.deposer_adieu(text, text, text, text, text, text);

create or replace function public.deposer_adieu(
  p_auteur     text,
  p_pour       text,
  p_mot        text,
  p_media_type text,
  p_media_url  text,
  p_media_mime text,
  p_campagne   text default null
)
returns table (jeton text, jeton_edition text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  alphabet constant text := '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  v_jeton   text := '';
  v_edition text := '';
  i int;
begin
  p_auteur := btrim(coalesce(p_auteur, ''));
  if p_auteur = '' then
    raise exception 'Le prénom est obligatoire.';
  end if;
  if char_length(p_auteur) > 80 then p_auteur := left(p_auteur, 80); end if;
  p_pour := left(btrim(coalesce(p_pour, '')), 80);
  p_mot  := left(btrim(coalesce(p_mot,  '')), 2000);

  if p_media_type is null or p_media_type not in ('texte', 'photo', 'audio', 'video') then
    p_media_type := 'texte';
  end if;

  if p_mot = '' and coalesce(p_media_url, '') = '' then
    raise exception 'Il faut au moins un mot ou un enregistrement.';
  end if;

  -- Une campagne inventée est refusée net. Sans ce contrôle, le
  -- navigateur pourrait écrire n'importe quelle étiquette dans la
  -- colonne et fabriquer des cartes fantômes.
  p_campagne := nullif(btrim(coalesce(p_campagne, '')), '');
  if p_campagne is not null then
    if not exists (select 1 from public.campagnes where slug = p_campagne and actif) then
      raise exception 'Cette page de départ n’existe pas.';
    end if;
  end if;

  for i in 1..22 loop
    v_jeton   := v_jeton   || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    v_edition := v_edition || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;

  insert into public.adieux (
    jeton, jeton_edition, auteur, pour, mot, media_type, media_url, media_mime, campagne
  ) values (
    v_jeton, v_edition, p_auteur, p_pour, p_mot, p_media_type,
    nullif(p_media_url, ''), nullif(p_media_mime, ''), p_campagne
  );

  return query select v_jeton, v_edition;
end $$;


grant execute on function public.campagne(text) to anon, authenticated;
grant execute on function public.carte(text)    to anon, authenticated;
grant execute on function public.deposer_adieu(text, text, text, text, text, text, text)
  to anon, authenticated;
