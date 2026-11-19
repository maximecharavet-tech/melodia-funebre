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

### Styles artistiques (18/11, 03 h 30)

28 styles choisis pour rester dans le ton (pré-prompts dans `api/_medias-styles.json`, côté serveur ; liste publique id/nom/vignette dans `assets/medias/medias.json`) : Aquarelle, Peinture à l'huile, Impressionnisme, Cubisme doux, Surréalisme poétique, Minimalisme, Art nouveau, Art déco, Gravure à l'eau-forte, Fusain, Vitrail, Estampe japonaise, Lavis à l'encre (sumi-e), Clair-obscur baroque, Pastel, Enluminure, Symbolisme, Préraphaélite, Photographie argentique, Noir et blanc fine art, Papier découpé, Mosaïque, Pointillisme, Paysage romantique, Feuille d'or (icône), Linogravure, Fresque, Cyanotype. Écartés : pop art, glitch, cyberpunk, dessin animé, manga, néon, vaporwave, graffiti, pixel art, 3D brillante, caricature. Aucun nom d'artiste : des époques et des techniques.

Chaque pré-prompt décrit le médium, la technique, la palette (ramenée vers noir chaud / ivoire / or doux) la texture et la composition. Seuls `id`, `nom`, `desc` (courte, en français) et la vignette (`assets/medias/styles/<id>.webp`, 256 px) sont publics, dans `assets/medias/medias.json`. « Aucun style » (photo Melodia) est le choix par défaut. Les interdits de sécurité sont TOUJOURS ajoutés, en dernier. Intensité du style (2 boutons) : « Léger » (touche du médium + enveloppe Melodia complète), « Marqué » (style + palette Melodia). L'ancien cran « Affirmé » reste accepté par le serveur.

Vignettes d'exemple : `assets/medias/styles/<id>.webp`, 512 px, toutes sur le même sujet (lys blancs dans un vase de verre et une bougie, près d'une fenêtre), générées gratuitement avec AI Horde (réseau communautaire, clé anonyme, aucun crédit dépensé) sur le modèle SDXL Juggernaut XL (licence CreativeML Open RAIL++-M, usage commercial permis), relues une à une (ni texte, ni visage, ni artefact). Script : `scripts/medias-vignettes-styles.py`.

Autres ajouts : 1 à 4 variantes par demande (chacune compte dans le plafond ; s'il reste moins de visuels que demandé, le serveur en fait autant qu'il en reste et le dit ; Julie choisit la sienne, le logo y est posé ensuite) ; « Recommencer avec le même style » ; historique des 8 dernières demandes (navigateur) ; styles favoris (★, en tête de liste, navigateur) ; légendes prêtes par réseau (Instagram, Facebook, LinkedIn, WhatsApp) ; texte alternatif proposé automatiquement (accessibilité), modifiable et copiable.

Zone du logo : la demande envoyée au moteur réserve la zone du logo pour chaque format (post : 34 % du haut ; story : 30 % du haut ; bannière : coin haut gauche, 26 % × 40 %) — fond calme, aucun sujet, sujet centré plus bas. Filet de sécurité à la pose : la console mesure le fond sous le logo (clarté moyenne, 95e centile, part de points clairs, agitation). Fond sombre : logo en « écran » sur un voile sombre doux, renforcé jusqu'à un noir presque pur si des pétales ou reflets passent dessous (le fond presque noir du fichier est ramené au noir pur pour ne pas dessiner de carré). Fond clair ou très coloré : pastille noire d'origine, avec halo ivoire doux sur une image claire chargée. Jamais de déformation : proportions d'origine.

Mise en page v2 « bandeau » (19/11/2026) : le moteur n'obéit pas toujours à la zone réservée (lys et pétales derrière « MELODIA FUNÈBRE » sur les essais réels du 19/11). La console ne dépend donc plus de lui : le visuel d'une génération est composé avec un bandeau uni — en haut (post, story), à gauche (bannière) — de la teinte sombre de la scène elle-même (médiane des bords, ramenée sous 6 % de clarté), fondu sur toute la largeur en dégradé doux (smoothstep). Le logo officiel repose sur ce fond uni : rien derrière lui, plus de voile local. La scène est placée sous le bandeau d'après la position mesurée du sujet (première ligne claire dans le tiers central, et première colonne pour la bannière) ; en post, si le sujet (fleurs → pied du vase) ne tient pas entre le bandeau et le pied, la scène est réduite et ses bords fondus dans le même ton. Le pied (mot, devise, adresse) repose aussi sur un fond uni, ce qui efface les faux sigles que le moteur dessine parfois en bas d'image. Sur fond de scène clair, la pastille noire d'origine est posée sur le bandeau clair.
