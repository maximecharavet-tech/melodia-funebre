-- ═══════════════════════════════════════════════════════════════
-- Migration 14 — Espace Médias : bucket des visuels générés
--
-- NON appliquée automatiquement — attend l'accord du fondateur.
-- Idempotente (rejouable). Aucune valeur secrète.
--
-- « Générer un visuel Melodia » (console commerciale, /api/medias-generer)
-- range dans ce bucket les images gardées par Julie (logo déjà posé), sous gardes/<dossier>/,
-- et une copie brute de chaque image du moteur, sous bruts/<dossier>/.
-- Contenu commercial seulement : jamais de donnée de famille ni de défunt
-- (ceux-là restent dans adieux / hommages / souvenirs, qu'on ne mélange
-- pas). Lecture publique, pour que les liens de partage s'ouvrent chez
-- n'importe qui. Écriture : uniquement le serveur (clé de service), donc
-- AUCUNE policy d'écriture pour anon ou authenticated.
--
-- Sans cette migration, la génération marche quand même (si elle est
-- activée) : l'adresse rendue est celle du moteur, et la console garde
-- la liste dans le navigateur de la collaboratrice.
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medias-commerciaux', 'medias-commerciaux', true, 15728640,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
