# Rapport — Melodia Funèbre Pro (console `/pro`)

Branche `claude/melodia-pro-app-20261111`, partie de `main` = `9198104`. Une seule PR vers `main`.
**Rien n'a été fusionné, rien n'a été déployé, aucune migration n'a été appliquée, aucune variable Vercel ni DNS ni région n'a été touchée, aucun service payant activé.**
Plan suivi : `PLAN_MELODIA_PRO_APP.md`.

## 1. Résumé

La console des agences partenaires existe désormais à `/pro` : questionnaire en sept étapes (hors ligne, mode famille, dictée), paiement par l'agence (Stripe Checkout en mode test, codes promo, code maître serveur), composition d'essai d'environ 2 min 30 (une par agence, anti-abus), pipeline paroles → relecture du prompt → musique → écoute maison → livraison, studio QR avec douze supports imprimables (SVG, PNG 300/600 dpi, PDF avec fond perdu et traits de coupe), pack promotionnel co-brandé, page mémorial pro, admin maison. Le cœur des règles est un noyau Rust compilé en WebAssembly (167 Ko), le même fichier dans le navigateur et dans les fonctions serveur.

Au passage, la faille des trois routes de génération ouvertes à tous (`generate-lyrics`, `generate-music`, `music-status`, `Access-Control-Allow-Origin: *`, aucune authentification) est fermée, et deux défauts préexistants ont été trouvés et corrigés (voir § 6).

Marque blanche (décision n° 6) : aucun nom de fournisseur dans l'interface, les PDF, les métadonnées audio (balises ID3 réécrites), les messages d'erreur, la page mémorial ; vérifié par tests et par recherche dans tout ce qui est servi.

## 2. Ce qui est livré, point par point

| § | Demande | État |
|---|---|---|
| A | Console `/pro` (PWA, coquille, latérale / onglets bas, 360 → 1440 px) et ses onze écrans | Fait. `dashboard-partenaire.html` garde son URL et gagne un lien « Console Pro ». Raccourcis N et /, squelettes, toasts, confirmations fortes (mot à retaper), `aria-live`, focus visibles, cibles ≥ 44 px, `prefers-reduced-motion`. Le « undo » n'est branché que sur l'infrastructure de toasts (aucune suppression irréversible n'existe dans la console). |
| B | Questionnaire 7 étapes, IndexedDB + serveur, hors ligne, mode famille, dictée, données sensibles | Fait. Prononciation du prénom (utilisée seulement dans les paroles chantées), artistes « ambiance seulement » jamais transmis, sujets à éviter, consentements, récapitulatif PDF. Les téléphones, e-mails, IBAN, adresses, n° longs sont signalés à la saisie et retirés de toute consigne par le noyau. |
| C | Stripe Checkout, promo, essai, prix Rust, TVA paramétrable, export CSV | Fait (REST direct, aucune dépendance). Webhook signé + idempotent, seul chemin vers « payé » pour un paiement réel. Tarifs agence `NULL` → « tarif non encore fixé ». Code maître : variable serveur, comparaison en temps constant, réservé au compte `master`, journalisé, 0 € → pas de Stripe. PayPal du tunnel famille intact. |
| D | Machine à états, routes, file de travaux, plafond, Realtime, livraison | Fait, sauf Realtime (voir § 7) : sondage `job-tick` toutes les 15 s. Agent parolier (Mistral puis OpenAI) qui compose aussi le prompt musical ; relecture et édition du prompt par le conseiller avant l'envoi ; musique par Mureka seul ; audio rapatrié dans le bucket privé `pro-audio`, URL signées ; plafond quotidien `NULL` = génération coupée + alerte. Pas de cron ajouté. |
| E | QR stable `/m/<jeton>`, rendu Rust stylé, exports, gabarits | Fait. Jeton Crockford 12 car. aléatoire ; réécriture existante `/m/:jeton` conservée, compteur d'ouvertures anonyme par `navigator.sendBeacon`. Modules carrés / arrondis / points, yeux carrés / arrondis, logo ≤ 20 % (monogramme officiel ou logo agence), niveau H, zone de silence ≥ 4, contraste refusé sous 4,5:1 ou si l'encre est plus claire que le fond, alerte module < 0,4 mm. Repli sur `assets/js/qr.js`. |
| F | Page mémorial | Fait dans `hommage.js` (repli sur `/api/pro/memorial` quand la fiche historique n'existe pas) : lecteur, paroles en option, mot de la famille, partage lien / WhatsApp / SMS / courriel, visibilité public / lien / code, `noindex` (meta + en-têtes `/hommage`, `/m/*`), co-branding discret. **Écart** : la mise en cache hors ligne du MP3 n'est pas faite pour les pages pro (URL signées d'un autre domaine, qui expirent ; voir § 7). La photo est prévue en base (`photo_path`) mais sans écran de dépôt. |
| G | Migration `20261112_10_pro_app.sql` | Fait, **non appliquée**. 18 tables, `app.mes_orgs()`, `app.mon_role_pro(org)`, RLS partout, colonnes réservées au service (privilèges de colonnes **et** déclencheurs), buckets privés, valeurs TBD, retour arrière commenté. |
| H | Crate `melodia-pro-wasm` | Fait : `qr`, `prix`, `promo`, `questionnaire`, `prompt`, `statut`, `essai`, `siret` (+ `texte`). 167 Ko après `wasm-opt` (201 Ko brut). |
| I | PWA, Android, Windows, iOS, doc plateformes | PWA prête. Android : projet Capacitor 7 généré, `cap sync` OK, App Links, icônes adaptatives ; **APK non compilé** (ni JDK ni SDK sur le poste). Windows : Tauri 2, `cargo check` et `cargo test` OK (Linux), installateur non construit. iOS : noté. `docs/pro-app/PLATEFORMES.md`. |
| J | Visuels et vidéos | `art/` et `video/` absents → **placeholders** aux noms et dimensions demandés (liste § 9), WebP + demi-taille pour `srcset`, posters, poster fixe si mouvement réduit. |
| K | Sécurité | Fait (détails § 5). |
| L | Accessibilité, i18n, performance | Lighthouse accessibilité 100. Chaînes principales dans `assets/i18n/pro.fr.json`, dates et prix par `Intl` ; une partie des textes d'écrans reste écrite dans les vues (§ 7). JS initial 55 Ko hors WASM. |

## 3. Fichiers

274 fichiers, +18 912 / −50 lignes (`git diff --shortstat main...HEAD`).

- **Noyau Rust** : `melodia-pro-wasm/` (Cargo, `src/{lib,texte,siret,prix,promo,statut,essai,questionnaire,prompt,qr}.rs`, `BUILD.md`), `assets/js/vendor/melodia_pro.wasm`, `assets/js/vendor/melodia-pro-glue.js`, `scripts/build-wasm.sh` (étendu).
- **Serveur** : `api/pro/{me,orgs,dossiers,checkout,promo,stripe-webhook,portal,trial,lyrics,music,job-tick,qr,memorial,scan,admin,export,invitations}.js` ; `lib/pro/{socle,depot,noyau,fournisseurs,paiement,moteur,audio,garde}.cjs` ; `lib/pro/routes/*.cjs`.
- **Routes historiques** : `api/generate-lyrics.js`, `api/generate-music.js`, `api/music-status.js` (garde), `api/music-config.js` (marque blanche), `assets/js/auth.js` (jeton joint par `MelodiaAI`).
- **Console** : `pro.html`, `pro.webmanifest`, `assets/css/pro.css`, `assets/i18n/pro.fr.json`, `assets/js/pro/{app,ui,i18n,memoire,noyau,donnees,pdf,gabarits,pack}.js`, `assets/js/pro/vues/{journee,dossiers,questionnaire,fiche,qr,bibliotheque,facturation,equipe,parametres,aide,admin,memorial,invitation}.js`.
- **Mémorial** : `assets/js/hommage.js` (+ empreinte dans `hommage.html`).
- **Base** : `supabase/migrations/20261112_10_pro_app.sql`, `supabase/migrations/20261111_09_console_v2.sql` (correctif), `scripts/prouver-migrations.mjs` (étendu).
- **Service worker / en-têtes** : `build/sw-modele.js`, `build/build.js` (version du SW calculée aussi sur la console), `sw.js` (régénéré), `vercel.json`, `.gitattributes`.
- **Applications** : `apps/android/**` (Capacitor), `apps/desktop/src-tauri/**` (Tauri 2), `.well-known/assetlinks.json`.
- **Visuels** : `assets/img/pro/**`, `assets/video/pro/**`, `scripts/pro-assets.mjs`, `scripts/pro-icones-apps.mjs`.
- **Tests** : `tests/pro/*.test.mjs`, `tests/e2e/{pro.e2e,serveur,lighthouse,qr-styles}.mjs`, `scripts/check.js` (fichiers et icônes de la console ajoutés).
- **Docs** : `PLAN_MELODIA_PRO_APP.md`, `THIRD_PARTY.md`, `docs/pro-app/{README,PLATEFORMES,ASSETS}.md`, ce rapport.
- Pages régénérées par `build/build.js` pour la seule nouvelle empreinte de `auth.js` / `hommage.js` : `compte.html`, `dashboard-commercial.html`, `dashboard-master.html`, `dashboard-partenaire.html`, `espace.html`, `offres.html`, `hommage.html`, `sitemap.xml`, `build/dates-sitemap.json`.

## 4. Captures et résultats des tests (chiffres exacts)

Captures (`docs/pro-app/captures/`) : 20 PNG — `1440-*`, `1024-*`, `390-*` (journée, questionnaire, relecture, livré, studio QR, aperçu mémorial), `390-7-memorial-public.png`, `1024-0-accueil.png` ; exports réels dans `captures/exports/` (carte SVG, PNG 300 et 600 dpi, PDF carte / plaque 8 cm / planche A4 / marque-page, récapitulatif, pack promotionnel).

| Suite | Commande | Résultat |
|---|---|---|
| Noyau Rust | `cargo test` (conteneur `rust:1-bookworm`) | **58 / 58** — dont chaque style de QR rastérisé et relu par `rqrr` (2 versions × 2 résolutions × 6 styles, avec logo), et le SVG lui-même relu |
| App Windows | `cargo check` + `cargo test` (Linux, dépendances WebKitGTK) | **check OK**, **2 / 2** |
| Routes | `npm run test:pro` (`node --test`) | **47 / 47** — auth refusée, CORS, limite de débit, routes historiques, webhook (signature fausse, trop vieille, rejeu, inconnu), promo valide / expirée / épuisée, code maître (graphies, refus sans oracle, absent du client), checkout (0 €, tarif NULL, sans clé, discounts), essai (deux fois, simultané, empreinte, plafond TBD, compte non validé), idempotence, plafond quotidien, verrou, backoff, pipeline complet, mémorial (code, jeton inconnu), audio sans trace de fournisseur, CSV (formules neutralisées), invitations |
| Migration | `npm run test:sql` (PGlite) | **20 / 20** preuves pro (idempotence, cloisonnement A/B, `paid` / `status` / `audio_url` interdits, lecture seule, Stripe et réglages invisibles, file de travaux maison seule, service role encaisse, aucun tarif inventé, RLS sur toutes les tables) ; preuves S1/S2/S4 historiques inchangées |
| Bout en bout | `npm run test:e2e` (Playwright, Chromium, CSP de `/pro` reproduite) | **40 / 40** en 1440, 1024 et 390 px : dossier → questionnaire → essai → paroles → composition → « livré » simulé → exports → relecture du PNG par **jsQR** (décodeur indépendant) → publication → mémorial public `/m/<jeton>` (noindex, partage, co-branding, compteur) |
| Styles QR | `tests/e2e/qr-styles.mjs` (jsQR) | **24 / 24** |
| Site | `npm run check` sur clone LF | **vert** (53 pages, 1 181 empreintes à jour). En local Windows, `check` échoue déjà sur `main` à cause de `core.autocrlf` (empreintes calculées sur du CRLF) : ce n'est pas lié à cette PR. |
| Console Julie | `npm run test:julie` | vert (aucune régression) |

Lighthouse 12.8 (local, `docs/pro-app/captures/lighthouse.json`) — Lighthouse 12 n'a plus de catégorie PWA ; installabilité vérifiée à la main (manifeste, SW, icônes 192/512/maskable) :

| Page | Appareil | Performance | Accessibilité | Bonnes pratiques |
|---|---|---|---|---|
| `/pro?demo=1` | mobile | 91 | **100** | 96 |
| `/pro?demo=1` | bureau | 71 | **100** | 96 |
| `/m/demo` (page existante) | mobile / bureau | 67 / 57 | **100** | 100 |

Le 71 « bureau » vient d'un temps de blocage simulé de 2,6 s sur ce poste ; mesuré réellement (PerformanceObserver), le chargement de `/pro` ne compte qu'**une** tâche longue de 61 ms, et 55 Ko de JavaScript au premier affichage (hors WASM 164 Ko). La performance de la page mémorial existante (feuille publique de 260 Ko) n'était pas dans le périmètre.

## 5. Revue hostile

| Angle | Constat | Traitement |
|---|---|---|
| Contournement du paiement | `paye` / `essai_accorde` ne s'obtiennent que par le service (Rust `statut.rs` + garde optimiste) ; l'API dossiers n'accepte que 4 états côté agence ; la base refuse `paid`, `status`, `audio_url` hors service role | Prouvé (tests Node + PGlite). |
| Essai multiple | une agence = un essai (`unique (org_id, rang)`), empreintes salées SIRET / domaine pro / téléphone / appareil, compte validé par la maison, plafond du jour (TBD = fermé) | Prouvé, y compris deux demandes simultanées. |
| Appel direct des fournisseurs | les trois routes historiques étaient ouvertes à tous | **Corrigé** : JWT + rôle `master`/`atelier`, CORS liste blanche, limite de débit. L'Atelier joint le jeton. |
| Fuite de fournisseur | `api/music-config` (public) renvoyait « Mureka », l'adresse de l'API et un indice de clé | **Corrigé** (marque blanche). Erreurs serveur « blanchies » ; métadonnées ID3 réécrites ; la file de travaux (erreurs internes) n'est lisible que par la maison (RLS resserrée pendant la revue). |
| Nom du défunt dans une URL ou un journal | jetons aléatoires sans voyelle I/O/U/L ; références `MF-XXXXXX` ; rien chez Stripe (testé) ; objet de courriel = référence ; journaux serveur limités au code d'erreur | OK. Le titre de la chanson figure dans la balise ID3 « titre » (choix assumé : c'est le titre relu par l'agence). |
| Mémorial indexé | `noindex` en meta et en en-tête (`/hommage`, `/m/*`, `/api/pro/memorial`), absent du sitemap, `robots.txt` inchangé (politique « noindex plutôt que Disallow » du site) | OK, testé en E2E. |
| Code d'accès deviné | 60 requêtes/min/IP | **Renforcé** : 10 essais de code par heure et par page. |
| QR illisible à l'impression | **bug trouvé** : dans le SVG, l'anneau clair de chaque œil recouvrait le carré central (les tests Rust relisaient la liste de formes, pas le SVG) | **Corrigé** grâce au décodeur indépendant jsQR ; ajout d'un test Rust qui relit le SVG lui-même ; 24/24 styles relus. Contraste et taille de module contrôlés. |
| Texte maladroit | « échec » s'affiche « Reprise par la maison — vous n'avez rien à faire » ; confirmations sobres ; aucune mention d'« IA » | Relu. |
| Accent sur « Funèbre » | un seul oubli : métadonnées PDF (`Funebre`) | **Corrigé** (PDFDocEncoding `\350`). |
| Artiste nommé dans un prompt | artistes jamais transmis ; proposition de l'agent filtrée (liste noire, artistes saisis, « in the style of », noms de fournisseurs) ; alerte si un artiste apparaît dans les paroles | Testé (Rust, Node, E2E). |
| Prix codé en dur | tarifs agence `NULL` en base et en démonstration ; seuls les prix publics famille (149/299/499 €) figurent, en `prix_public_cents` | OK (preuve PGlite). |
| Migration non idempotente | rejouée deux fois sans erreur | Prouvé. |
| Service worker figé | les modules ES de `/pro` (sans empreinte) auraient été servis « cache d'abord » | **Corrigé** : branche réseau d'abord pour la console, version du SW calculée aussi sur ses fichiers. |
| Code maître | la valeur « MASTERMAX » se devine (elle figure dans la décision et ressemble à l'identifiant réservé `mastermax07`) | Elle ne vaut **que** pour un compte maison `master` ; pour tout autre compte la réponse est celle d'un code inconnu. Recommandation : choisir quand même une valeur longue et aléatoire pour `PRO_CODE_MAITRE`. |
| Fichiers PDF corrompus sur Windows | sans octet nul, Git traitait les PDF comme du texte (CRLF) | **Corrigé** : `.gitattributes` (`*.pdf binary`). |

## 6. Défauts préexistants trouvés

1. **Migration 09** (non appliquée) : elle remplaçait `melodia_capacites()` par une version appelant `melodia_capacites_base()`, jamais créée ; appliquée en production elle aurait échoué. Corrigé au plus juste (renommage de l'ancienne fonction en `_base`, une seule fois).
2. **`api/music-config`** public : nom du fournisseur et indice de clé exposés. Corrigé.
3. **`scripts/prouver-migrations.mjs`** ne passait plus depuis la migration 09 (alias `public.est_master/est_maison` absents du simulateur) et n'émulait pas les privilèges par défaut de Supabase. Corrigé.
4. Hors périmètre, signalé : si `/api/generate-lyrics` refuse (désormais sans jeton), `MelodiaAI.lyrics` retombe comme avant sur Pollinations depuis le navigateur — comportement historique de l'Atelier maison, à revoir si l'on veut qu'aucune donnée ne parte vers ce service gratuit.

## 7. Ce qui reste à faire (écarts assumés)

- **Realtime Supabase** non branché : la fiche sonde `job-tick` toutes les 15 s (la migration indique la ligne `alter publication` à passer).
- **Cron** non ajouté (plan Vercel inconnu) ; `job-tick` accepte déjà `Bearer $CRON_SECRET`.
- **Nombre de fonctions Vercel** : la PR ajoute 17 fonctions (`api/pro/*`), soit 34 au total. **À vérifier contre le plan Vercel** avant la mise en ligne ; au besoin, les regrouper derrière une route dynamique `api/pro/[route].js` (les routes sont déjà des modules purs).
- **Durée de l'essai (2 min 30)** : obtenue par la structure des paroles et la consigne musicale, puis contrôlée à l'écoute par la maison ; pas de découpe audio. L'option « extrait 60 s » existe comme réglage (`essai_mode`) mais n'est pas produite.
- **MP3 hors ligne** sur les pages mémorial pro : non fait (URL signées d'un autre domaine, qui expirent ; les mettre en cache conserverait l'audio d'une page que la famille pourrait retirer).
- **Photo du mémorial** et **sites multiples** (`pro_sites`) : prévus en base, sans écran.
- **Invitations** : lien généré et copiable ; l'envoi par courriel n'est pas branché (seule la livraison prévient par courriel si Resend est configuré).
- **i18n** : statuts, navigation, messages communs dans `pro.fr.json` ; les textes longs des écrans sont encore écrits dans les vues.
- **APK Android** et **installateur Windows** : non construits (outillage absent / poste Windows requis) ; Tauri vérifié sous Linux seulement.
- **Stripe** : flux entièrement simulé dans les tests ; à rejouer avec de vraies clés de test.
- Pousser la branche déclenche, comme pour les PR précédentes, un **aperçu** Vercel (Git) ; aucune mise en production.

## 8. Actions que seul Maxime peut faire

1. **Stripe (mode test)** : poser `STRIPE_SECRET_KEY` (`sk_test_…`) et `STRIPE_WEBHOOK_SECRET` ; déclarer le webhook `https://<domaine>/api/pro/stripe-webhook` (événements `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `invoice.paid`) ; activer le portail client.
2. **Créer les Promotion Codes** dans Stripe (puis « Synchroniser » dans Admin maison).
3. **Code maître** : poser `PRO_CODE_MAITRE` (idéalement une valeur longue) et, si besoin, `PRO_CODE_MAITRE_EMAILS` ; poser `PRO_EMPREINTE_SEL` (chaîne aléatoire).
4. **Valeurs TBD** dans Admin maison (`pro_settings`, `pro_offers`) : tarifs agence des trois offres, `essai_plafond_jour`, `plafond_jour_cents`, coûts estimés paroles / musique, `tva_bp` si sortie de la franchise, `job_tentatives_max`, `email_alerte`, `essai_mode`. Tant que le plafond du jour est vide, aucune génération ne part et les essais restent fermés.
5. **Appliquer les migrations 09 (corrigée) puis 10** sur Supabase, après relecture ; activer Realtime sur `pro_dossiers` si souhaité.
6. Vérifier le **nombre de fonctions** autorisé par le plan Vercel (§ 7).
7. **Stores** (à la toute fin, décision n° 5) : compte Google Play, clé de signature et **empreinte SHA-256** dans `.well-known/assetlinks.json` ; plus tard Apple Developer.
8. **Certificat de signature Windows** (`bundle.windows.certificateThumbprint`), et clés de l'updater Tauri si l'on active les mises à jour.
9. Remplacer les **placeholders** (§ 9) par les visuels définitifs (`art/`, `video/`), puis `node scripts/pro-assets.mjs` et `node scripts/pro-icones-apps.mjs`.

## 9. Placeholders à remplacer

Images (`assets/img/pro/`, en `.webp` + demi-taille ; PNG gardé pour les deux premiers) : `icon-1024` (1024²), `splash-2732` (2732²), `onboarding-1-questionnaire`, `onboarding-2-composition`, `onboarding-3-qr` (1280×800), `empty-dossiers`, `empty-bibliotheque`, `empty-qr` (960×540), `qr-card-mockup` (1600×1200), `store-bg-phone` (1080×1920), `store-bg-tablet` (2560×1600).
Dérivés : `assets/img/pro/icons/pro-{192,512,maskable-512}.png`, `apps/desktop/src-tauri/icons/*`, `apps/android/ressources/*`, mipmaps et écrans de lancement Android.
Vidéos (`assets/video/pro/`) : `hero-loop.{mp4,webm,webp}` et `promo-app-pro.{mp4,webm,webp}` (1280×720, sans son).
Procédure : `docs/pro-app/ASSETS.md`.

## 10. Pull request

Lien : https://github.com/maximecharavet-tech/melodia-funebre/pull/27 (non fusionnée, non déployée).
