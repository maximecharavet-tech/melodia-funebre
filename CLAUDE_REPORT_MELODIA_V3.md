# Rapport — Melodia Funèbre v3 : attrait commercial, design, solidité

12 novembre 2026 · branche `claude/melodia-v3-attrait-20261112` (depuis `main` `ec3b9a1`)

**Rien n'a été fusionné, déployé, promu ni annulé.**

- Aucune migration n'a été appliquée, et aucune n'a été écrite : la v3 n'en a pas besoin.
- Aucune variable d'environnement, aucun DNS, aucune région (`cdg1`), aucune facturation n'a été
  touchée.
- Aucun service payant n'a été appelé, aucun générateur non plus. Aucune image, aucune vidéo n'a
  été produite.

## Pull request

**Non ouverte : `gh` n'est pas installé sur ce poste.** La branche est poussée, sans autre détour.
Pour ouvrir l'unique PR (titre : `Melodia v3 : attrait commercial + design + solidité technique`) :
<https://github.com/maximecharavet-tech/melodia-funebre/compare/main...claude/melodia-v3-attrait-20261112>

## Commits

| # | Commit | Contenu |
|---|---|---|
| 1 | Plan | `PLAN_MELODIA_V3.md` |
| 2 | Commercial | Promesses alignées, tunnel familles allégé, page agences clarifiée, repère 40 % dans `/pro` |
| 3 | Design | Charte stricte (plus d'aplat d'or), styles des blocs v3, visuels de couverture |
| 4 | Technique | CSS minifiée au build, marque blanche du script public, code maître retiré du dépôt, garde-fous |
| 5 | Pages | Régénération (clone LF), `style.min.css`, `sw.js` par le modèle |
| 6 | Docs | `VISUELS_V3.md`, `THIRD_PARTY.md`, ce rapport |

---

## 1. Audit commercial

Méthode : lecture du dépôt (générateur `build/`, pages servies, scripts, routes, console `/pro`),
puis contrôle du rendu dans Chromium, sur bureau et sur mobile. Aucune donnée de trafic ni de
vente n'était disponible. Les priorités reposent donc sur l'impact attendu, le risque et
l'effort, pas sur des mesures.

### Ce qui marche déjà

- Le ton, juste.
- Un catalogue d'œuvres réelles, écoutables sans inscription.
- La réassurance SACEM.
- Les pages de requête et les données structurées riches.
- Un générateur discipliné.

La vitrine n'est pas le problème.

### Ce qui freinait la vente : des contradictions qu'un acheteur attentif repère

| # | Constat | Pourquoi ça coûte | v3 |
|---|---|---|---|
| K1 | « Première composition offerte » (accueil, FAQ, `/professionnels`) alors que `/pro` accorde **une composition d'essai d'environ 2 min 30, une fois par agence, après vérification du compte** | La première chose que fait une agence, c'est essayer : elle découvre une offre plus étroite que promis | ✅ Une seule formulation, celle de `/pro`, partout sur le site public et dans `llms.txt` |
| K2 | Témoignage « Directeur d'agence — Lyon », anonyme, alors que la même page écrit qu'aucune donnée réelle n'existe encore côté agences | Faux signal sur un marché où tout le monde se connaît ; risque de pratique trompeuse | ✅ Retiré (section supprimée, `visible: false` dans `content.json`, rien n'est détruit) |
| K3 | Cinq étoiles sur chaque témoignage | Une note que personne n'a donnée sur une plateforme d'avis | ✅ Étoiles retirées (générateur et hydratation) |
| K4 | Héros `/professionnels` : « Organiser une démonstration » menait au formulaire, juste au-dessus de « aucun formulaire à remplir » | Promesse contredite au premier clic | ✅ Bouton principal « Voir la démonstration » (`/pro?demo=1`, vraiment sans compte), rendez-vous en second |
| K5 | Étape 1 : « accès immédiat au tableau de bord », alors que chaque compte est vérifié | Déception à l'ouverture du compte | ✅ Texte exact |
| K6 | « Règlement mensuel sur facture » (site) contre règlement par dossier depuis la console (`/pro`, Stripe) | Le dirigeant lit deux contrats | ✅ Aligné sur la console : règlement par dossier et export comptable mensuel. 📝 À confirmer (§ 6) |
| K7 | « 60 % pour l'agence » (site) contre « l'agence paie, tarifs TBD » (`/pro`) | Les deux ne tiennent ensemble que si le tarif agence vaut 40 % du prix public, et ce n'était écrit nulle part clairement | ✅ Bloc **« Comment circule l'argent »** (montants tirés des trois prix publics) ; repère 40 % dans `/pro` → Facturation et Admin. 📝 Tarifs à saisir par la maison |
| K8 | Barre mobile « Commander » (familles) sur la page des pompes funèbres ; sur `/offres`, elle renvoyait vers `/offres` | Le geste du pouce parle au mauvais public | ✅ Barre selon le public |
| K9 | FAQ « carte bancaire ou PayPal » alors que l'encaissement passe par un lien PayPal.me | Promesse de paiement non tenue | ✅ « Par PayPal » |
| K10 | « Le plus choisi » sur Prestige | Affirmation de vente invérifiable à ce stade | ✅ « Notre conseil ». 📝 À rétablir si les ventes le confirment |
| K11 | Tunnel : portrait obligatoire ; « régler après l'entretien » en bouton secondaire | Une famille épuisée abandonne à l'étape la plus longue ; le choix le plus rassurant est caché | ✅ Portrait facultatif (« je préfère tout raconter au téléphone ») ; deux options de paiement à égalité |
| K12 | Simulateur : « une famille sur quatre » présenté comme hypothèse « prudente » et figé | Chiffre de conversion sans mesure | ✅ Curseur réglable, présenté comme l'hypothèse du dirigeant ; prix limités aux trois offres |
| K13 | Deux sections « Pourquoi proposer Melodia » (7 puis 6 cartes) | Page plus longue, sans rien de plus | ✅ Doublon retiré |
| K14 | Noms de fournisseurs dans un script **servi** (`auth.js`, commentaires et consigne), plus un repli qui envoyait le brief d'une famille (prénom, anecdote) à un service tiers gratuit | Marque blanche et RGPD | ✅ Corrigé (§ 3) |
| K15 | `style.css` : 296 Ko, dont un tiers de commentaires | Premier affichage mobile | ✅ Minifiée au build (§ 3) |

### Proposition de valeur

**Familles** : le message « Chaque vie mérite sa chanson » est conservé. Ce qui change, c'est la
prise en charge, dite plus tôt et plus clairement :

- deux gestes dès le héros de `/offres` (« Commencer ma commande », « Être rappelé ») ;
- « Seuls son prénom et vos coordonnées sont indispensables » ;
- « réserver l'entretien et régler après », présenté à égalité avec le paiement immédiat.

**Agences** : la promesse reste ce que vit la famille. La marge vient ensuite, avec le mécanisme
complet : la famille règle le prix public à l'agence, la maison facture 40 %, l'agence garde
60 %. Puis l'essai réel, et une démonstration sans compte en premier geste, partout (accueil,
héros, simulateur, appel final, barre mobile, `/demo`).

### Tarifs

Seuls les tarifs publics sont affichés :

- 149, 299 et 499 € ;
- 60 % pour l'agence ;
- essai d'environ 2 min 30.

Les parts « agence » et « maison » (89,40 / 59,60 €, 179,40 / 119,60 €, 299,40 / 199,60 €) sont le
calcul exact des 60 % déjà publiés. **Aucun nouveau prix, quota, délai ni volume.** Les tarifs
agence restent `null` (TBD) en base : le repère 40 % est affiché dans `/pro` → Admin, rien n'est
saisi.

### Appels à l'action

| Page | Principal | Secondaire |
|---|---|---|
| Accueil (porte agences) | Pour les professionnels | Voir la démonstration |
| `/offres` | Commencer ma commande | Être rappelé |
| `/professionnels` | Voir la démonstration | Demander un rendez-vous |
| Barre mobile familles | Commander | Être rappelé |
| Barre mobile agences | Voir la démonstration | Être rappelé |

### Signaux de confiance (réels uniquement)

- Faux signaux retirés : témoignage d'agence anonyme, étoiles, « le plus choisi ».
- Rien d'ajouté qui n'existe pas : aucun avis, aucun logo client, aucun chiffre de familles ou de
  chiffre d'affaires, aucun `aggregateRating`. Un test le garde.
- Les preuves vérifiables restent en avant : catalogue écoutable, page famille de démonstration,
  console en démonstration, le fondateur qui répond lui-même.

### Capture de leads

Aucun nouveau prestataire.

- Le formulaire agence (`/api/lead`) reste inchangé.
- La voie autonome (démonstration, puis ouverture du compte agence) est désormais le geste
  principal.
- Côté familles, le tunnel exige moins : le portrait se recueille au téléphone. Le brief transmis
  le signale (« PORTRAIT : à recueillir pendant l'entretien »).

### SEO

- `Service` B2B : une `Offer` à 0 € qui décrit l'essai, la seule offre agence chiffrée
  publiquement.
- Meta description de `/professionnels` réécrite (60 % du prix famille, essai, démonstration sans
  compte).
- Sitemap : dates régénérées par le build.
- `llms.txt` : le mécanisme 60/40, l'essai, le lien de démonstration.
- Pages clés gardées par un test : titre ≤ 70, description 70–170, canonique, `og:image` présente
  sur disque.
- Aucune nouvelle page créée : des pages « par ville » sans agences réelles seraient du contenu
  creux.

---

## 2. Changements effectués

### Commercial (`build/`, `assets/data/content.json`, `assets/js/`)

- `build/data.js` et `content.json` :
  - essai précisé ;
  - paiement « par PayPal » ;
  - « Notre conseil » ;
  - témoignage d'agence retiré du repli, `visible: false` dans le contenu publié.
- `build/p-index.js` : porte agences (« essai offert »), bloc agences (démonstration, essai
  2′30), appel final (« régler après »).
- `build/p-offres.js` et `assets/js/order.js` :
  - héros à deux gestes ;
  - étape 3 facultative avec saut `data-wz-goto` (vers l'avant seulement, étape courante
    validée) ;
  - paiement en deux options égales.
  - **Identifiants `#paypal-zone`, `#o-submit` et `data-act="sendOrder"` inchangés : le flux
    PayPal n'est pas modifié.**
- `build/p-agences.js` :
  - héros, bandeau (2′30 essai offert), bloc console (photo réelle) ;
  - trois gestes illustrés, bloc « Comment circule l'argent » ;
  - simulateur (taux réglable, trois offres) ;
  - étapes, FAQ et conditions alignées sur la console ;
  - témoignage et section en double retirés ; appel final avec démonstration.
- `build/gen.js` : barre du pouce selon le public.
- `vercel.json` : redirection temporaire `/demo` → `/pro?demo=1`.
- `/pro` :
  - Facturation : repère « la famille règle le prix public ; la part de la maison en représente
    40 % ».
  - Admin → Tarifs agence : « repère 40 % : X centimes » sous chaque offre (`prix_public_cents`
    ajouté à la réponse de `lib/pro/routes/admin.cjs`, en CommonJS).

### Design (`assets/css/style.css` bloc « v3 », `assets/css/pro.css`)

- **Plus d'aplat d'or**, comme l'exige la charte. Passent en ivoire `#f2efe8` ou en encre
  `#0b0b11`, cernés d'un filet d'or :
  - boutons principaux (site et `/pro`), étiquette d'offre ;
  - pastilles d'étape, de lecture et de partage ;
  - curseurs, filtres et lien d'évitement.

  Sur les sections ivoire, le bouton s'inverse en encre. Le texte en dégradé d'or des titres
  reste : c'est un trait, pas un aplat.
- Styles des nouveaux blocs : filets d'un pixel, chiffres en JetBrains Mono, titres en Cormorant,
  grilles qui passent sur une colonne sous 720–900 px.
- Visuels OG déjà livrés en fond des héros de `/offres` (pupitre) et de `/professionnels` (bureau
  d'accueil). Ils sont déclarés **uniquement** dans `@media (min-width: 1000px)` : un téléphone ne
  les télécharge pas (vérifié dans Chromium : `background-image: none` à 390 px). Un masque les
  fond dans l'encre.
- Médaille 3D : conservée sur l'accueil uniquement, aux conditions de la v2. Sur
  `/professionnels`, la photo réelle de la console la remplace, et three.js n'y est plus chargé.
- Accessibilité :
  - `:focus-visible` sur les nouveaux boutons ;
  - tableau de répartition avec `caption` ;
  - textes alternatifs décrivant ce qu'on voit (« écran éteint, aucune interface simulée ») ;
  - `prefers-reduced-motion` pour toute nouvelle transition ;
  - aucune taille de texte sous le plancher de 12,5 px (`check.js`).
- Mobile : la barre du pouce accepte des libellés sur deux lignes, les options de paiement
  s'empilent, le tableau défile.

### Technique

- **`build/css-min.js`** : minification prudente.
  - Elle ne touche jamais aux chaînes, aux `url()`, ni aux espaces autour de `+`, `-` et `:`.
  - `build/build.js` produit `assets/css/style.min.css` avant les pages, et les pages générées
    la chargent. `style.css` reste la source éditée à la main ; les consoles et `hommage.html`
    continuent de la charger.
  - `check.js` vérifie la présence des deux fichiers ; le test v3 vérifie que la version
    minifiée est à jour.
- **Marque blanche, script public `auth.js`** :
  - commentaires et consigne sans nom de fournisseur ;
  - **repli tiers des paroles retiré** : il envoyait le prénom et l'anecdote d'un défunt à un
    service gratuit, hors contrat. La rédaction passe uniquement par la fonction serveur
    authentifiée.
- **Marque blanche, console maître** : libellés génériques.
- Les routes musique passaient déjà par `garder()`, qui retire les noms de fournisseurs de toute
  réponse JSON. Les deux indications de configuration sont réécrites pour rester lisibles une
  fois blanchies.
- **Code maître** :
  - sa valeur littérale ne figure plus nulle part dans le dépôt.
  - L'identifiant réservé de l'ancien mode démo (servi dans `auth.js`, il contenait le mot) est
    remplacé par un contrôle de format d'adresse, qui l'écarte de toute façon.
  - Les tests JS et Rust utilisent une valeur témoin (`CLEFTEMOIN`) et prouvent toujours la
    saisie insensible à la casse, aux espaces et aux tirets.
  - Le code reste lu dans `PRO_CODE_MAITRE`, côté serveur seulement.
- **`tests/api/site-v3.test.mjs`** (14 tests, dans `npm test`) :
  - aucun nom de fournisseur dans les fichiers servis ;
  - aucune valeur de code maître dans tout le dépôt ;
  - aucun nom de réglage secret côté client ;
  - plus de repli tiers ;
  - essai décrit comme dans `/pro` ;
  - aucun avis fabriqué ;
  - prix 149/299/499 et parts 60/40 ;
  - JSON-LD lisible sur toutes les pages ;
  - méta des pages clés ;
  - barre du pouce selon le public ;
  - tunnel (saut d'étape, paiement à égalité, identifiants PayPal intacts) ;
  - feuille minifiée à jour ;
  - minificateur ;
  - redirection `/demo` et région `cdg1`.

---

## 3. Preuves

Toutes les commandes ont tourné **en local**. Le site a été régénéré dans un clone
`core.autocrlf=false`, pour des empreintes exactes.

| Épreuve | Commande | Résultat |
|---|---|---|
| Tests du dépôt (api, chargement CommonJS de chaque `api/*`, exposition, pro, paiement, sécurité, pipeline, noyau, Julie, v3) | `npm test` | ✅ **138 / 138** |
| Site complet | `npm run check` | ✅ « Site complet, liens internes valides. » |
| Génération idempotente | `node build/build.js` deux fois, puis clone neuf | ✅ aucune différence (0 fichier modifié dans un clone neuf) |
| Noyau Rust (valeur témoin) | `cargo test` (Docker `rust:1-bookworm`) | ✅ **58 / 58**. Le `.wasm` n'a pas changé : seuls des tests et un commentaire ont été modifiés |
| Migrations (PGlite, local) | `scripts/prouver-migrations.mjs` | ✅ **35 / 35**. Aucune application distante |
| E2E `/pro` (Chromium) | `tests/e2e/pro.e2e.mjs` | ✅ **40 / 40**, aucune erreur JavaScript |
| `vercel build` hors ligne (Docker `node:22-bookworm`, projet fictif local) + chargement de chaque `.func` | `npx vercel@latest build` puis `node --no-experimental-require-module sonde-func.cjs` | ✅ **34 fonctions, 0 en échec**, avec et sans `require(esm)` ; aucun `ERR_REQUIRE_ESM` |
| Exposition | sortie statique de `vercel build` | ✅ aucun `.md` racine, ni `tests/`, ni `build/` ; `/lib/*` → `/404` ; `/demo` → `/pro?demo=1` (307) |
| Rendu `style.css` contre `style.min.css` | captures pleine page de 6 pages × 2 largeurs, aléa fixé | ✅ **identiques au pixel** partout où la page est déterministe. Le seul écart (`/demos`, 390 px) existe aussi entre deux rendus avec la même feuille |
| Parcours v3 (Chromium) | captures bureau et mobile, saut d'étape, barre mobile, mouvement réduit | ✅ aucune erreur JS. Seuls 404 : `/_vercel/insights` et `/_vercel/speed-insights`, qui n'existent qu'en production |

### Poids

| Ressource | Avant | Après |
|---|---|---|
| Feuille de style, brotli | 58 Ko | **29 Ko** (191 Ko brut) |
| Feuille de style, gzip | 73 Ko | **35 Ko** |
| `/professionnels` | three.js chargé sur grand écran (135 Ko compressés) | non chargé ; une photo WebP de 84 Ko en `loading="lazy"` |

---

## 4. Visuels

Voir **`VISUELS_V3.md`** : 4 réemplois et 5 manques.

- **Réemplois** : la photo de la console et les trois visuels d'onboarding sur `/professionnels`,
  les deux visuels OG en fond des héros.
- **Manques** : deux héros mobiles 4:5, un bandeau facultatif, le kit agence allégé (simple
  redimensionnement), un aperçu social de l'accueil.

Chaque manque a un emplacement, un format, un ratio et un prompt prêt à l'emploi. Aucun n'est
branché : aucun placeholder n'est visible en ligne.

---

## 5. Auto-revue hostile

| Point | Constat |
|---|---|
| Régression ESM | `lib/pro/routes/admin.cjs` reste en CommonJS. Le test de chargement de chaque `api/*` est vert, et `vercel build` + sonde donnent 34/34. Aucun `"type": "module"` ajouté, aucun `require()` vers de l'ESM |
| Secrets | Aucun dans le diff. Valeur du code maître retirée du dépôt (test sur tout l'arbre). Aucun nom de réglage secret côté client (test) |
| Code maître côté client | Absent (test sur le client, la colle WASM, `pro.html`, `auth.js` désormais compris) |
| Fournisseurs côté utilisateur | Absents des fichiers servis (test). Le texte en clair ne subsiste que dans le code serveur, blanchi à la sortie par `garder()` |
| Docs internes exposées | `VISUELS_V3.md`, ce rapport et le plan sont à la racine en `.md`, donc ignorés (vérifié dans la sortie de `vercel build`). Le correctif v2 est intact |
| Accessibilité | Contraste : ivoire sur encre, et encre sur ivoire pour les boutons. Focus visible, `caption`, alternatives honnêtes, cibles ≥ 44 px dans la barre du pouce |
| `prefers-reduced-motion` | Nouvelles transitions neutralisées ; capture en mouvement réduit sans erreur |
| Performance mobile | Aucun visuel de couverture ni aucune 3D téléchargés sous 1000 px ; feuille de style divisée par deux |
| Migrations | Aucune écrite, aucune appliquée |
| Faux témoignages ou chiffres | Un témoignage retiré, des étoiles retirées, une affirmation retirée. Rien d'ajouté. Le simulateur ne fixe plus d'hypothèse |
| Tunnel PayPal | Identifiants et `data-act` inchangés. Parcours complet joué jusqu'au paiement dans Chromium (bouton « Régler 299 € par PayPal » présent) |

---

## 6. Ce qui reste à trancher par le fondateur

1. **Tarifs agence (P0).** Pour tenir la promesse publique, chaque tarif agence vaut 40 % du prix
   public : 59,60 €, 119,60 € et 199,60 € HT, puisque la TVA n'est pas applicable. Le repère est
   affiché dans `/pro` → Admin, rien n'est saisi. Si la maison préfère un autre modèle, c'est le
   texte public (« 60 % ») qu'il faudra changer, et il est désormais concentré dans le bloc
   « Comment circule l'argent ».
2. **Modalité de règlement agence.** Le site dit maintenant ce que fait la console : règlement par
   dossier, export comptable mensuel. Si la maison veut une facture mensuelle, il faut adapter
   `/pro` ou le texte.
3. **Témoignages familles (3 visibles).** Ne les garder que s'ils sont vérifiables (prénom, ville,
   accord écrit). Celui de l'agence est masqué, pas détruit : `visible: true` dans le mode
   propriétaire le rétablirait, à ne faire qu'avec un nom d'agence et un accord.
4. **« Notre conseil »** : à remplacer par « Le plus choisi » si les ventes le confirment. La
   description de Prestige **en base** (`pro_offers`, issue de la migration 10 déjà en
   production) dit aussi « le choix le plus fréquent ». La corriger demanderait un nouveau fichier
   de migration ou une édition dans Supabase : non fait.
5. **Affirmations à vérifier ou à dater** :
   - « À ce jour, aucune famille n'est repartie avec une œuvre qu'elle ne souhaitait pas
     diffuser » (FAQ) ;
   - « Nous n'avons trouvé aucune autre maison française proposant cela » (accueil) ;
   - l'hypothèse de départ du simulateur (25 %, désormais réglable).
6. **Juridique (P0, inchangé depuis la v2)** :
   - mentions légales incomplètes (forme, adresse, SIRET) ;
   - médiateur de la consommation à désigner ;
   - « rétractation de 14 jours » à valider (œuvre personnalisée, art. L221-28 3°).
7. **Encaissement familles** : toujours un lien PayPal.me. `PAYPAL_CLIENT_ID` (identifiant public)
   activerait le bouton officiel et permettrait de rétablir la mention « carte ».
8. **Supports hors site** :
   - les brochures PDF et les modèles de courriel de la console Julie parlent encore de
     « première composition offerte ». Le sens est le même (c'est l'essai), mais pas la précision.
     Après validation de la formulation, il faut relancer `npm run pdf` et ajuster les modèles.
     Ils n'ont pas été touchés, pour ne rien casser chez Julie.
   - L'atelier de la console maître appelle toujours un service gratuit pour les visuels
     d'accompagnement : seul un mot-clé de métier lui est envoyé, jamais un prénom. À arbitrer.
9. **Code maître.** Sa valeur a figuré dans des commits antérieurs du dépôt. La v3 la retire de
   l'arbre courant, mais l'historique Git la conserve. **Recommandation : choisir une nouvelle
   valeur pour `PRO_CODE_MAITRE` dans Vercel.** Le code accepte toujours n'importe quelle casse et
   les espaces. Rien n'a été modifié de mon côté.

## 7. Volontairement non fait

- **Aucun déploiement**, aucune promotion, aucun retour arrière.
- **Aucune migration** écrite ni appliquée ; aucune commande Supabase distante.
- **Aucun réglage Vercel** : environnement, domaines, région et facturation intacts.

Rappel des réglages serveur, par leur nom seulement :

- Supabase : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ;
- `/pro` : `PRO_CODE_MAITRE`, `PRO_CODE_MAITRE_EMAILS`, `PRO_EMPREINTE_SEL`, `PRO_URL_SITE` ;
- paiement : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` ;
- composition et rédaction : les clés lues par `api/generate-music.js`, `api/generate-lyrics.js`
  et `lib/pro/fournisseurs.cjs` (noms détaillés dans le rapport v2, interne) ;
- `RESEND_API_KEY`, `CRON_SECRET` ;
- plafonds en base (`pro_settings`, TBD).

D'autres choses n'ont pas été faites, délibérément :

- **Aucune image générée.**
- **Aucun nouveau prestataire.**
- **Aucun code tiers** : voir `THIRD_PARTY.md`.
- **Le flux de paiement** (PayPal famille, Stripe agence, webhook) n'a pas été modifié dans sa
  logique.

## 8. Risques restants

1. **Le bouton principal change d'apparence sur tout le site** : il passe d'un or plein à un
   ivoire cerné d'or, comme l'impose la charte. C'est voulu, mais visible. À regarder sur un vrai
   téléphone avant mise en ligne.
2. **Tarifs agence toujours TBD** : `/pro` refuse le paiement avec un message clair tant qu'ils ne
   sont pas saisis.
3. **Portrait facultatif** : des briefs arriveront plus courts. Ils sont signalés comme tels, et
   l'entretien téléphonique doit les compléter.
4. **`style.min.css`** : toute retouche de `style.css` doit être suivie de la génération. Le test
   v3 échoue sinon, ce qui est voulu.
5. Les copies déjà indexées de documents internes (avant la v2) restent à vérifier dans la Search
   Console.
