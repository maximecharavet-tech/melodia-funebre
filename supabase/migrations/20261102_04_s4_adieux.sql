-- ═══════════════════════════════════════════════════════════════
-- S4 — Le dossier « adieux » n'accepte plus un dépôt anonyme libre.
--
-- Le studio public envoie désormais le fichier par /api/adieu-media,
-- qui vérifie le type, la taille et le préfixe, puis dépose avec la
-- clé de service (elle contourne les policies, le contrôle est dans
-- la fonction). Un appel direct avec la clé publique est refusé :
-- plus aucune policy INSERT pour anon.
--
-- Un compte connecté peut encore déposer, seulement sous un préfixe
-- et une extension de la liste. La lecture publique des messages déjà
-- déposés ne change pas (la policy « les adieux se lisent » reste).
--
-- Le plafond de taille et les types MIME du bucket (25 Mo, images,
-- audio, vidéo listés) restent ceux du live : cette policy s'y ajoute.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "chacun depose son adieu" on storage.objects;

drop policy if exists "adieu authentifie et borne" on storage.objects;
create policy "adieu authentifie et borne" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'adieux'
    and name ~ '^[a-z0-9]{8,40}/[a-z0-9]{16,40}\.(jpg|png|webp|mp4|webm|mp3|m4a|ogg)$'
  );
