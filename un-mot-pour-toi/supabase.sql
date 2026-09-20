-- ═══════════════════════════════════════════════════════════════
-- UN MOT POUR TOI — la base
--
-- Une seule table, deux fonctions, un espace de fichiers. Tout est
-- séparé du reste du projet Supabase : rien ici ne touche aux
-- commandes, aux comptes ni aux pages mémoriales.
--
-- LE PRINCIPE DE SÉCURITÉ, EN UNE PHRASE
--
-- Personne ne lit la table. Ni le navigateur, ni un visiteur, ni un
-- curieux muni de la clé publique : la lecture passe uniquement par
-- la fonction « adieu(jeton) », qui exige le jeton complet de
-- vingt-deux caractères et ne rend jamais qu'une seule ligne.
--
-- Sans cela, la clé « anon » — qui est publique par construction,
-- lisible dans le code de la page — permettrait de lister TOUS les
-- messages d'adieu de tout le monde. Ce n'est pas une hypothèse
-- d'école : c'est la première chose que fait quiconque ouvre les
-- outils de développement.
--
-- LE DÉPÔT PASSE AUSSI PAR UNE FONCTION
--
-- Plutôt que d'autoriser le navigateur à écrire dans la table, on
-- lui donne une porte étroite : « deposer_adieu ». Elle valide les
-- longueurs, fabrique elle-même le jeton — le navigateur ne le
-- choisit pas — et rend les deux jetons à celui qui dépose.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.adieux (
  jeton          text primary key,
  jeton_edition  text not null,
  auteur         text not null,
  pour           text not null default '',
  mot            text not null default '',
  media_type     text not null default 'texte',
  media_url      text,
  media_mime     text,
  cree_le        timestamptz not null default now(),
  vues           integer not null default 0,
  vu_le          timestamptz,
  actif          boolean not null default true,
  constraint adieux_jeton_long    check (char_length(jeton) = 22),
  constraint adieux_edition_long  check (char_length(jeton_edition) = 22),
  constraint adieux_auteur_long   check (char_length(auteur) between 1 and 80),
  constraint adieux_pour_long     check (char_length(pour) <= 80),
  constraint adieux_mot_long      check (char_length(mot) <= 2000),
  constraint adieux_type_connu    check (media_type in ('texte', 'photo', 'audio', 'video'))
);

create index if not exists adieux_pour_idx on public.adieux (pour);

alter table public.adieux enable row level security;

-- Aucune politique de lecture, aucune politique d'écriture : avec RLS
-- activé, l'absence de politique vaut refus. La table est donc
-- totalement fermée au navigateur, et ne s'ouvre que par les deux
-- fonctions ci-dessous.
revoke all on public.adieux from anon, authenticated;


-- ─── Lire un message, et un seul ───
-- « security definer » : la fonction s'exécute avec les droits de son
-- propriétaire, donc elle voit la table que le visiteur ne voit pas.
-- Le search_path est figé : sans cela, un appelant pourrait faire
-- pointer « public » ailleurs et détourner la fonction.
create or replace function public.adieu(j text)
returns table (
  auteur text, pour text, mot text,
  media_type text, media_url text, media_mime text, cree_le timestamptz
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  -- Un jeton de la mauvaise longueur ne peut pas exister : on rend
  -- une réponse vide sans même interroger la table.
  if j is null or char_length(j) <> 22 then return; end if;

  update public.adieux a
     set vues = a.vues + 1, vu_le = now()
   where a.jeton = j and a.actif;

  return query
    select a.auteur, a.pour, a.mot, a.media_type, a.media_url, a.media_mime, a.cree_le
      from public.adieux a
     where a.jeton = j and a.actif;
end $$;


-- ─── Déposer un message ───
-- Le jeton est fabriqué ICI, pas dans le navigateur : celui qui dépose
-- ne choisit pas l'adresse de sa page, et ne peut donc pas écraser
-- celle d'un autre ni en deviner une.
create or replace function public.deposer_adieu(
  p_auteur     text,
  p_pour       text,
  p_mot        text,
  p_media_type text,
  p_media_url  text,
  p_media_mime text
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

  -- Un message vide de tout : ni mot, ni fichier. On refuse plutôt
  -- que de fabriquer un QR qui ouvrira une page blanche.
  if p_mot = '' and coalesce(p_media_url, '') = '' then
    raise exception 'Il faut au moins un mot ou un enregistrement.';
  end if;

  -- L'alphabet écarte les caractères qu'on confond en les recopiant :
  -- ni 0/O, ni 1/l/I. Le jeton finit parfois tapé à la main.
  for i in 1..22 loop
    v_jeton   := v_jeton   || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    v_edition := v_edition || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;

  insert into public.adieux (
    jeton, jeton_edition, auteur, pour, mot, media_type, media_url, media_mime
  ) values (
    v_jeton, v_edition, p_auteur, p_pour, p_mot, p_media_type,
    nullif(p_media_url, ''), nullif(p_media_mime, '')
  );

  return query select v_jeton, v_edition;
end $$;


-- ─── Retirer son propre message ───
-- Le jeton d'édition est la seule preuve : celui qui l'a déposé l'a,
-- personne d'autre. On ne supprime pas la ligne, on l'éteint — ainsi
-- un QR déjà imprimé affiche « ce message a été retiré » plutôt
-- qu'une erreur.
create or replace function public.retirer_adieu(j text, e text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare touche int;
begin
  if j is null or e is null or char_length(j) <> 22 or char_length(e) <> 22 then
    return false;
  end if;
  update public.adieux set actif = false
   where jeton = j and jeton_edition = e;
  get diagnostics touche = row_count;
  return touche > 0;
end $$;


-- Les trois fonctions sont appelables sans compte : c'est le principe
-- même du QR, qui s'ouvre sans rien demander à personne.
grant execute on function public.adieu(text)            to anon, authenticated;
grant execute on function public.deposer_adieu(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.retirer_adieu(text, text) to anon, authenticated;


-- ─── Les fichiers ───
-- Un espace à part, en lecture publique : le QR doit s'ouvrir sans
-- compte, donc la vidéo doit se lire sans compte. Le dépôt est
-- ouvert lui aussi, mais borné — un fichier par message, et un
-- plafond de taille fixé sur l'espace lui-même.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'adieux', 'adieux', true, 26214400,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/webm','audio/mpeg','audio/mp4','audio/ogg']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "les adieux se lisent" on storage.objects;
create policy "les adieux se lisent" on storage.objects
  for select to anon, authenticated using (bucket_id = 'adieux');

drop policy if exists "chacun depose son adieu" on storage.objects;
create policy "chacun depose son adieu" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'adieux');
