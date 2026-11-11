# Plan — Melodia Funèbre Pro (console `/pro`)

Branche `claude/melodia-pro-app-20261111`, une seule PR vers `main`, ni merge ni déploiement.
Les décisions de Maxime du 11/11/2026 à 21 h 28 priment sur tout TBD du cahier des charges.

## 0. Ce que la lecture du dépôt a appris (11/11/2026)

| Sujet | Constat | Conséquence |
|---|---|---|
| Fins de ligne | `core.autocrlf=true` : `npm run check` échoue en local sur les empreintes `?v=` (CRLF), il passe sur un clone LF | builds et `check` se jouent sur un clone LF propre (`/tmp`), comme sur Vercel |
| Outillage | ni `cargo` ni Postgres sur le poste ; Docker 29 disponible | `cargo test`, build wasm, `cargo check` Tauri et ffmpeg dans le conteneur officiel `rust:1-bookworm` ; Postgres simulé par PGlite (déjà utilisé par `prouver-migrations.mjs`) |
| Routes de génération | `generate-lyrics`, `generate-music`, `music-status` : aucune auth, `Access-Control-Allow-Origin: *` | JWT Supabase + rôle maison exigé, CORS par liste blanche (`entetesOrigine` existant), limite de débit (`tropSouvent` existant) ; `MelodiaAI` (auth.js) joint le jeton |
| Aides serveur existantes | `api/_courrier.js` : `origineAutorisee`, `entetesOrigine`, `tropSouvent`, `entetesService` | réutilisées ; ajout de `capacitor://localhost` et `https://tauri.localhost` pour `/api/pro/*` seulement |
| Service worker | `sw-modele.js` sert en **cache d'abord** toute ressource GET même sans empreinte | les modules ES de `/pro` (sans `?v=`) seraient figés : ajout d'une branche **réseau d'abord** pour `/assets/js/pro/`, `pro.css`, `i18n`, `melodia_pro.wasm` ; version du SW calculée aussi sur ces fichiers |
| Mémorial | `/m/:jeton` → `hommage?j=` ; `hommage.js` appelle la RPC `memorial(j)` (définie hors dépôt) | la table `memoriaux` n'est **pas** modifiée ; les mémoriaux pro vivent dans `pro_qr` et sont servis par `api/pro/memorial` ; `hommage.js` n'y recourt que si la RPC ne trouve rien |
| Cron | `vercel.json` ne déclare aucun cron ; le plan Vercel n'est pas connu | **pas de cron ajouté** ; le pipeline avance par `api/pro/job-tick` appelé par le sondage client (15 s) et, plus tard, par un cron si Maxime le valide |
| `check.js` | toute page racine : icône 48 px, chemins d'actifs absolus, CSS ≥ 0,78 rem, `noindex` pour les consoles | `pro.html` respecte ces règles dès l'écriture |

## 1. Noyau Rust `melodia-pro-wasm/` (source de vérité unique)

Calqué sur `console-julie-wasm` : `cdylib`, ABI C + JSON en mémoire linéaire (pas de `wasm-bindgen`, donc le même `.wasm` se charge à l'identique dans le navigateur et dans Node), `opt-level="z"`, LTO, `panic=abort`.

Modules :
- `qr` — crate `qrcode` (MIT/Apache, sans fonctionnalités par défaut) → SVG stylé : modules carrés / arrondis / points, yeux carrés / arrondis, couleurs, logo central ≤ 20 % (réserve blanche), niveau H, zone de silence ≥ 4, contrôle de contraste WCAG (refus < 4,5:1 et encre plus claire que le fond), taille physique en mm → alerte si module < 0,4 mm. Tests de décodage `rqrr` (dev-dependency) sur chaque style, rendu raster maison.
- `prix` — centimes entiers, remises en points de base, plancher 0, TVA paramétrable (franchise 293 B par défaut), refus des prix `NULL`/TBD.
- `promo` — format d'un code (A–Z 0–9 -, 3–40) et normalisation insensible à la casse et aux espaces (« master max » = « MASTERMAX ») ; jamais la valeur du code maître.
- `questionnaire` — schéma des 7 étapes, validation, complétude par étape, détection/retrait des données sensibles (téléphone, IBAN, e-mail, adresse postale, NIR).
- `prompt` — construction déterministe de la consigne parolier et du prompt musical (≤ 500 car.), paroles bornées à 3 000 car., liste noire d'artistes (les artistes aimés ne servent qu'à déduire une ambiance, jamais cités), marque blanche (aucun nom de fournisseur).
- `statut` — machine à états du dossier, transitions légales/illégales, acteur autorisé (agence / maison / service).
- `essai` — éligibilité (compte validé, SIRET Luhn, e-mail non jetable, empreintes anti-abus, plafond global/jour), durée 150 s (décision n° 2).
- `siret` — format + Luhn (y compris l'exception La Poste).

Build : `scripts/build-wasm.sh` étendu → `assets/js/vendor/melodia_pro.wasm` (≤ 200 Ko). Colle JS : `assets/js/vendor/melodia-pro-glue.js` (navigateur, ESM) et `lib/pro/noyau.mjs` (Node, lit le même fichier).

## 2. Données — `supabase/migrations/20261112_10_pro_app.sql` (fichier seulement, jamais appliqué)

Tables : `pro_orgs, pro_sites, pro_members, pro_invitations, pro_offers, pro_dossiers, pro_questionnaires (jsonb versionné), pro_lyrics_versions, pro_tracks, pro_jobs, pro_payments, pro_stripe_events (event_id unique), pro_promo_codes (miroir Stripe), pro_trials, pro_qr, pro_usage, pro_audit, pro_settings`.
Fonctions : `app.mes_orgs()`, `app.mon_role_pro(org)`, `app.pro_peut_ecrire(org)`, déclencheur `pro_dossiers_garde` qui refuse toute modification de `status`, `paid`, `audio_url`, `stripe_*` hors `service_role`.
RLS partout, buckets `pro-audio` et `pro-pieces` privés, `pro_settings` pré-rempli : `essai_par_org = 1`, `essai_duree_s = 150` (décidés), tout le reste `NULL` + `tbd = true`. `pro_offers` : trois offres sans prix (`price_cents NULL`). Idempotente (`if not exists`, `drop policy if exists`, `on conflict do nothing`) ; retour arrière commenté en fin de fichier.
Preuves : `scripts/prouver-migrations.mjs` étendu (PGlite) — migration jouée deux fois, agence A ne voit pas B, un membre ne peut pas passer `paid=true` ni changer `status`, `lecture` ne peut pas écrire.

## 3. Serveur — `api/pro/*.js` + `lib/pro/*.mjs`

Socle `lib/pro/socle.mjs` : CORS liste blanche (site, aperçus du projet, `capacitor://localhost`, `https://tauri.localhost`, localhost), JWT vérifié auprès de `/auth/v1/user`, rôle maison (`roles`) ou membre pro (`pro_members`), limite de débit, REST service role, journal d'audit, erreurs **en marque blanche** (aucun nom de fournisseur ne sort du serveur).

Routes : `me`, `dossiers`, `checkout`, `promo`, `stripe-webhook`, `portal`, `trial`, `lyrics`, `music`, `job-tick`, `qr`, `memorial`, `scan`, `admin`, `export` (CSV comptable), `invitations`.
- Paiement : l'**agence** paie (décision n° 1). Stripe REST direct (aucune dépendance), mode test, `allow_promotion_codes` + `discounts` si code saisi et validé. Sans `STRIPE_SECRET_KEY` : 503 « paiement non configuré ». Prix lu dans `pro_offers` ; `NULL` → 409 « tarif non encore fixé ».
- Code maître (décision n° 7) : comparé en temps constant à `PRO_CODE_MAITRE` (variable serveur), normalisé (casse, espaces), accepté **uniquement** pour un compte maison `master` ; sinon réponse identique à un code inconnu (pas d'oracle). Journalisé. Total 0 € → pas de Stripe, paiement `code_maitre` enregistré côté serveur.
- Webhook : signature `Stripe-Signature` (HMAC-SHA256, tolérance 5 min, comparaison constante), idempotence `pro_stripe_events`, seul chemin vers `payé` pour un paiement réel.
- Essai : 1 par organisation, 150 s, éligibilité Rust + empreintes SHA-256 salées (`PRO_EMPREINTE_SEL`), plafond global/jour lu dans `pro_settings` (NULL = essais fermés), revue maison avant livraison.
- Pipeline : `lyrics` → agent parolier (Mistral puis OpenAI, existants) qui rend paroles + prompt musical ; le conseiller relit/édite le prompt ; `music` met un job en file ; `job-tick` (verrou `locked_until`, tentatives, backoff exponentiel, idempotence `dossier_id+version`) soumet à la musique (Mureka seul, décision n° 3), interroge, rapatrie l'audio dans `pro-audio`, **nettoie les balises ID3** et pose les siennes (« composé par Melodia Funèbre »), passe à `contrôle_maison`. Plafond de dépense quotidien (`pro_settings.plafond_jour_cents`, NULL = génération coupée) qui bloque et alerte.

Routes existantes corrigées : `generate-lyrics`, `generate-music`, `music-status` → JWT + rôle maison/atelier, CORS restreint, limite de débit, messages sans nom de fournisseur côté client.

## 4. Console `/pro` (PWA)

`pro.html` (coquille, `noindex`, CSP stricte avec Stripe), `assets/css/pro.css` (jetons du design system v4), modules ES `assets/js/pro/` : `app.js` (routeur, raccourcis N et /, toasts, undo, aria-live), `donnees.js` (adaptateur API réel + adaptateur **démo** IndexedDB qui simule le pipeline — sert aux E2E et à la découverte sans compte), `questionnaire.js` (7 étapes, autosauvegarde IndexedDB + serveur, hors ligne, mode famille, dictée), `dossiers.js` (liste + kanban), `fiche.js`, `qr-studio.js`, `pdf.js` (petit écrivain PDF maison, vectoriel, polices standard — aucune dépendance), `pack.js` (pack promotionnel co-brandé, décision n° 4), `equipe.js`, `admin.js`, `facturation.js`, `memoire.js` (IndexedDB), `i18n.js` + `assets/i18n/pro.fr.json`.
`dashboard-partenaire.html` garde son URL et gagne un lien vers `/pro`. `pro.webmanifest` (`start_url: /pro`, `standalone`, `orientation: any`).

## 5. QR, impressions, mémorial

`/m/<jeton>` (base32 Crockford 12 car., aléatoire, aucun nom) déjà réécrit vers `hommage` ; `hommage.js` complété : repli sur `api/pro/memorial`, code d'accès, paroles en option, mot de la famille, partage (lien, WhatsApp, SMS, e-mail), co-branding discret, `noindex` (en-tête `X-Robots-Tag` déjà posé + meta), compteur d'ouvertures anonyme (`api/pro/scan`, aucune IP stockée).
Exports : SVG (Rust), PNG 300/600 dpi (canvas), PDF (fond perdu 3 mm, traits de coupe). Gabarits : carte A6/A5 noire et ivoire, faire-part, livret, marque-page, plaques 6/8/10 cm, sticker urne, chevalet, planche A4.

## 6. Plateformes

`apps/android/` Capacitor (config, App Links, icônes, `assetlinks.json` à empreinte vide) ; `apps/desktop/` Tauri 2 (impression, export SVG, updater préparé désactivé) avec `cargo check` dans Docker ; iOS noté. `docs/pro-app/PLATEFORMES.md` (étapes et coûts à valider).

## 7. Assets

`art/` et `video/` absents → placeholders aux noms et dimensions demandés (fond `#040407`, filet or, monogramme officiel), rendus par Chromium (Playwright) et ffmpeg (Docker) ; WebP, posters, `prefers-reduced-motion`.

## 8. Sécurité, accessibilité, performance

CSP stricte sur `/pro` (`js.stripe.com`, `checkout.stripe.com`), `frame-ancestors 'none'`, uploads contrôlés (PNG/JPEG/WebP ≤ 2 Mo, jamais de SVG utilisateur), aucune clé de service côté client. WCAG 2.2 AA : focus visibles, cibles ≥ 44 px, `prefers-reduced-motion`, contrastes. JS initial < 150 Ko hors WASM (modules chargés à la demande).

## 9. Tests

1. `cargo test` (Docker) : QR décodé par `rqrr` pour chaque style, contraste, prix, transitions, essai, SIRET, nettoyage du prompt.
2. `node --test tests/pro/*.test.mjs` : auth refusée sans jeton, CORS, webhook (signature invalide, rejeu, événement inconnu), promo valide/expirée, code maître (casse, refus hors maître, pas d'oracle), essai consommé deux fois, plafond quotidien, idempotence des jobs, marque blanche des erreurs, routes héritées protégées. Stripe et fournisseurs simulés.
3. PGlite : RLS et garde des colonnes.
4. Playwright local : dossier → questionnaire → essai → `livré` simulé → QR SVG/PNG/PDF → mémorial, en 390, 1024 et 1440 px, captures `docs/pro-app/captures/`.
5. `npm run check` vert sur clone LF.

## 10. Revue hostile, rapport, PR

Relecture attaquant + famille en deuil (liste du cahier des charges), corrections, `CLAUDE_REPORT_MELODIA_PRO_APP.md`, PR unique vers `main`. Ni merge, ni déploiement, ni migration appliquée, ni variable Vercel modifiée.

## Ordre d'exécution

1. Noyau Rust + tests (Docker en tâche de fond) → 2. migration + preuves PGlite → 3. socle serveur + routes + tests Node → 4. correctif des routes héritées → 5. console `/pro` → 6. mémorial → 7. SW, manifeste, en-têtes → 8. assets → 9. Android/Tauri/docs → 10. E2E + captures → 11. `check`, revue hostile, rapport, PR.
