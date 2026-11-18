# Espace « Médias » — console commerciale

Document interne (dossier `docs/`, non téléversé). 18 novembre 2026, Europe/Paris.

## Contenu (assets/medias/, catalogue `assets/medias/medias.json`)

Préparé par `python3 scripts/medias-preparer.py` (métadonnées retirées, sons retirés des plans vidéo).

### 10 vidéos (plans muets)

| id | titre | source |
|---|---|---|
| f-m01 … f-m08 | Mots croisés, Banc du jardin, Route des peupliers, À la fenêtre, L'atelier, La cérémonie, Le livret et le lys, Sur le parvis | plans image→vidéo du film « Sa chanson » (15/11/2026), `/workspace/campagne-pub-melodia-ziggy/video/clips/melodia` (9:16) et `melodia-16x9` (16:9, et carré recadré dedans) |
| f-seuil, f-lys | Le seuil, Les lys | hero du site (`assets/video/hero/01-seuil`, `05-lys`, 10/11/2026) ; seul le carré est nouveau |

Écartés : hero `02-pas` (mains pâteuses) et `04-carte` (main à revoir), `03`, `06`, `07`, `08` (plus anciens ; `08` montre un portrait encadré) ; les montages 30 s / 20 s (musique provisoire et voix de synthèse).

### 10 visuels (affiches approuvées, 941×1672, + 4:5 et 1:1 sur fond flouté)

Les 13 affiches du 16/11/2026 (`/workspace/melodia-cgpt`, copie dans `/workspace/melodia-ad/chatgpt-visuels`), moins trois : la planche multi-affiches, et les deux scènes de famille photoréalistes avec enfants au premier plan (« Souvenirs en musique dorée », « Souvenirs qui résonnent en famille »). Les personnages sont illustrés/générés : aucune personne réelle. Le logo y est déjà posé (approuvé par Maxime).

## Générer un visuel Melodia (refonte du 18/11, 03 h)

Julie écrit librement « Décrivez votre image », choisit un format (Post 1:1, Story 9:16, Bannière 16:9) et appuie sur « Générer ». Dix cartes d'idées (vignettes tirées des médias existants) pré-remplissent le champ ; tant que l'idée reste dans le texte, son pré-prompt détaillé est ajouté côté serveur (`api/_medias-idees.json`, version publique sans pré-prompt dans `assets/medias/medias.json`).

Côté serveur (`api/_medias.js`), toujours : l'enveloppe de style Melodia (`STYLE`) et les interdits de sécurité (`INTERDITS` : pas de texte, pas de logo généré, pas de visage réaliste d'enfant, pas de personne réelle connue, pas de cercueil, pas d'effet gadget). La demande composée ne sort jamais du serveur.

Logo : le fichier officiel `assets/img/logo-melodia-complet.jpg` (1600 px) est posé par la console sur CHAQUE résultat, proportions d'origine, marges de sécurité (zones d'interface des stories comprises). Variante automatique selon la clarté de la zone : fond sombre → mode « écran » (le noir du fichier disparaît, le dessin reste exact) ; fond clair → pastille noire du fichier d'origine. Option : signature (« Chaque vie mérite sa chanson. » + MELODIA-FUNEBRE.FR) et « Ajouter un mot » (désactivé par défaut), écrits par la console, jamais par le moteur. Puis Télécharger / Partager / Garder dans Mes créations.

Moteur : API à jeton d'Image MAX Gen (Hyper Engine) : `POST /api/image/tasks`, `POST /api/image/tasks/tick`, `GET /api/image/tasks/:id`. L'image est relayée par `/api/medias-generer?brut=` (même origine) pour que le logo puisse être posé et l'image exportée.

Éteint par défaut. Pour l'allumer (Vercel, projet melodia-funebre, Production) :

| Variable | Valeur |
|---|---|
| `MEDIAS_GENERATION` | `true` |
| `HYPER_ENGINE_IMAGE_TOKEN` | jeton créé par Maxime sur hyper-engine.ai : `POST /api/image/tokens {"label":"Melodia","dailyMax":30}` (affiché une seule fois) |
| `MEDIAS_GENERATION_JOUR` | facultatif, plafond par collaborateur et par 24 h (défaut 10, max 50) |
| `HYPER_ENGINE_URL` | facultatif (défaut `https://hyper-engine.ai`) |

Côté Hyper Engine : la migration `0102_image_studio.sql` doit être appliquée (sinon 503 `schema_missing`) et le pare-feu Vercel doit laisser passer `/api/image/tasks*` (le « Security Checkpoint » répond aujourd'hui à un client automatique).

Rangement : bucket `medias-commerciaux` (migration `supabase/migrations/20261118_14_medias_commerciaux.sql`, non appliquée) : `gardes/` (images composées, logo posé, listées dans Mes créations) et `bruts/` (copie brute du moteur). Sans lui, « Garder » range l'image brute et ses réglages dans le navigateur, et la console la recompose (logo compris) à chaque ouverture.

« Modifier » (affiches existantes) utilise la même pose du logo.
