# Plan — Melodia Funèbre v3 : attrait commercial, design, solidité

Branche `claude/melodia-v3-attrait-20261112`, partie de `main` (`ec3b9a1`, PR #28 incluse).
Une seule PR vers `main` si `gh` existe ; sinon branche poussée et lien de comparaison.
Ni fusion, ni déploiement, ni migration appliquée, ni variable d'environnement touchée,
ni service payant appelé, ni image générée.

Ordre imposé : **commercial → design → technique → rapport.**

---

## 0. Constats de l'audit (lecture du dépôt, 12/11/2026)

La vitrine est déjà solide (ton, catalogue écoutable, SEO riche, générateur discipliné).
Ce qui freine encore la vente, ce sont des **contradictions** que lit un acheteur attentif :

| # | Contradiction ou frein | Où |
|---|---|---|
| K1 | « Première composition offerte » à quatre endroits, alors que l'offre réelle de `/pro` est **un essai par agence, extrait de 2 min 30, après vérification du compte** | accueil (bloc agences), FAQ générale, `/professionnels` (étape 3, « ce que nous fournissons ») |
| K2 | Un témoignage « Directeur d'agence — Lyon », anonyme, alors que la même page écrit qu'**aucune donnée réelle n'existe encore** et que le lancement B2B n'a pas eu lieu | `/professionnels` (« Ils l'ont fait »), carrousel de l'accueil, `content.json` |
| K3 | Étoiles « 5 sur 5 » sur chaque témoignage : une note que personne n'a donnée | carrousel |
| K4 | Héros `/professionnels` : « Aucun formulaire à remplir pour la démonstration » sous un bouton… qui mène au formulaire | `/professionnels` |
| K5 | Étape 1 du partenariat : « accès immédiat au tableau de bord », alors que chaque compte d'agence est vérifié avant l'essai | `/professionnels` |
| K6 | « Règlement mensuel sur facture récapitulative » (site) contre règlement **par dossier depuis la console** (`/pro`, Stripe) | FAQ B2B, conditions |
| K7 | « 60 % pour l'agence » (site) contre « l'agence paie, tarifs TBD » (`/pro`) : cohérent seulement si le tarif agence vaut 40 % du prix public. Le site l'écrit une fois (« nous facturons les 40 % restants ») sans l'expliquer | `/professionnels`, `/pro` → Facturation |
| K8 | Barre d'action mobile « Commander » (familles) affichée aussi sur la page des pompes funèbres ; sur `/offres`, elle renvoie vers… `/offres` | toutes pages |
| K9 | FAQ : « par carte bancaire ou PayPal » alors que la v2 a corrigé la note de bas de grille en « PayPal » (lien PayPal.me, carte non garantie) | FAQ, `/offres` |
| K10 | « Le plus choisi » : affirmation de vente non vérifiable à ce stade | grille tarifaire |
| K11 | Tunnel familles : le portrait (étape 3) est obligatoire alors que l'entretien téléphonique le recueille de toute façon ; « régler après l'entretien » présenté comme un second choix | `/offres` |
| K12 | Simulateur : « une famille sur quatre » présenté comme hypothèse « prudente », non réglable | `/professionnels` |
| K13 | Deux sections « Pourquoi proposer Melodia » quasi identiques (7 cartes puis 6) : la page s'allonge sans rien ajouter | `/professionnels` |
| K14 | Marque blanche : des noms de fournisseurs dans des **messages d'erreur** des routes musique, et dans les commentaires et une chaîne d'un script **servi** (`auth.js`), qui envoie aussi le brief d'une famille (prénom, anecdote) à un service tiers gratuit de repli | `api/generate-music.js`, `api/music-status.js`, `api/generate-lyrics.js`, `assets/js/auth.js`, `dashboard-master.html` |
| K15 | `style.css` : 296 Ko bruts, dont un tiers de commentaires ; 59 Ko en brotli, 29 Ko une fois minifié | toutes pages générées |

## 1. Commercial (priorité 1)

### Accueil
- Bloc agences : remplacer « 1ʳᵉ composition offerte » par « Essai offert · 2 min 30 » (K1).
- Porte « pompe funèbre » du héros : mentionner l'essai gratuit à côté des 60 %.
- Appel final : rappeler qu'on peut **réserver l'entretien et régler ensuite**.

### `/offres` (tunnel familles, PayPal inchangé)
- Héros : deux gestes clairs, « Commencer ma commande » (ancre `#commander`) et « Être rappelé ».
- Étape 3 « Portrait » facultative (K11) : plus de champ obligatoire, bouton « Je préfère tout
  raconter au téléphone » qui mène au contact. Le brief signale alors « portrait à recueillir à
  l'entretien ». Le schéma accepte déjà `traits = ''`.
- Étape 6 : deux options à égalité, « Régler maintenant » et « Réserver l'entretien, régler
  après ». Mêmes identifiants et mêmes `data-act` : le flux PayPal ne change pas.
- FAQ paiement corrigée (K9), dans `build/data.js` **et** `assets/data/content.json`.
- « Le plus choisi » → « Notre conseil » (K10), aux deux mêmes endroits.

### `/professionnels`
- Héros : bouton principal « Voir la démonstration » (`/pro?demo=1`, vraiment sans formulaire),
  bouton secondaire « Demander un rendez-vous » (`#partenariat`) (K4).
- Nouveau bloc **« Comment circule l'argent »** : la famille règle le prix public à l'agence ;
  la maison facture à l'agence 40 % de ce prix, réglés depuis la console ; l'agence garde 60 %.
  Montants calculés depuis les prix publics (149 / 299 / 499 €), rien d'autre (K6, K7).
- FAQ B2B et conditions alignées sur la console (règlement par dossier, export mensuel) (K6).
- Essai : une seule formulation partout (K1). Étape 1 corrigée (K5).
- Retrait du témoignage d'agence non vérifiable (K2) : section supprimée,
  `visible: false` dans `content.json` (le contenu reste récupérable par le propriétaire).
- Simulateur : le taux de prise devient un curseur (« votre hypothèse ») (K12).
- Section redondante supprimée (K13).
- Bloc console : la photo réelle `assets/img/v2/console-portable.webp` remplace la médaille
  3D (plus concrète pour une agence, et three.js n'est plus chargé sur cette page).
- Bande « la console en trois gestes » avec les trois visuels d'onboarding déjà livrés
  (`assets/img/pro/onboarding-{1,2,3}-640.webp`).

### Toutes pages
- Barre d'action mobile selon le public (K8) : « Voir la démonstration · Être rappelé » sur
  `/professionnels` ; « Commander » mène à `#commander` sur `/offres`.
- Étoiles retirées des témoignages (K3).
- Redirection courte `/demo` → `/pro?demo=1` (utile au téléphone et dans les courriels de Julie).

### `/pro` (console)
- Facturation : un repère explique le lien avec les 60 % publics, sans afficher de prix
  non fixé. Les montants restent saisis par la maison dans Admin → Offres (TBD).

### SEO
- `Service` B2B : `offers` sans prix (essai gratuit décrit), `potentialAction` vers la démo.
- Titres et descriptions relus (longueur, promesse, essai).
- `sitemap.xml` : dates régénérées par le build.
- `llms.txt` relu pour supprimer la promesse « première composition offerte » s'il la porte.

## 2. Design (priorité 2)

- Charte : fonds `#040407 / #0b0b11 / #101018`, or en filets uniquement, ivoire `#f2efe8`,
  Cormorant Garamond / Jost / JetBrains Mono. Aucun logo régénéré, aucun portrait.
- Nouveaux blocs (« Comment circule l'argent », options de paiement, bande console) : filets
  d'un pixel, rythme vertical cohérent, numéros en JetBrains Mono.
- Héros `/offres` et `/professionnels` : visuels OG déjà livrés (pupitre ; bureau d'accueil),
  posés en fond **sur grand écran seulement** (media query CSS : rien n'est téléchargé sur
  mobile), sous un dégradé qui garde le contraste du texte.
- Mobile-first : barre pouce par public, boutons pleine largeur sous 600 px, cibles ≥ 44 px.
- Accessibilité : `:focus-visible` sur les nouveaux boutons, `prefers-reduced-motion` sur toute
  nouvelle transition, textes alternatifs honnêtes (ce qu'on voit, pas ce qu'on vend).
- `VISUELS_V3.md` : visuels encore manquants (emplacement, format, ratio, prompt prêt à
  l'emploi). Aucun placeholder branché sur une page publique.

## 3. Technique (priorité 3)

- **CSS minifiée au build** : `build/build.js` produit `assets/css/style.min.css` depuis
  `style.css` (source inchangée, toujours éditée à la main) ; les pages générées la chargent.
  Minificateur interne prudent (respecte chaînes et `url()`), vérifié par comparaison de
  rendus Chromium avant/après. `sw.js` régénéré par `build/sw-modele.js`.
- **Marque blanche** (K14) : messages d'erreur génériques côté client, détail en log serveur ;
  commentaires du script servi neutralisés ; repli client vers le service tiers gratuit retiré
  (données d'une famille envoyées hors de tout contrat).
- **Tests** : `tests/api/site-v3.test.mjs` (dans `npm test`) :
  - aucun nom de fournisseur dans les fichiers servis ;
  - aucun code maître côté client ;
  - plus de « première composition offerte » ;
  - prix publics cohérents ;
  - pas d'`aggregateRating` ;
  - JSON-LD valide ;
  - balises meta et OG présentes sur les pages clés ;
  - barre mobile adaptée au public ;
  - `style.min.css` à jour ;
  - témoignage d'agence absent.
- Garde-fous existants à garder verts : chargement CommonJS de chaque `api/*`, exposition,
  paiement, sécurité, pipeline, noyau, Julie.
- Preuves : `npm test`, `npm run check` (clone LF), régénération idempotente,
  `prouver-migrations` (PGlite), E2E `/pro` (Chromium), `vercel build` en Docker + sonde des
  fonctions (aucun téléversement). Rust non touché, donc pas de reconstruction WASM.

## 4. Livraison

Commits : plan → commercial → design → technique et tests → docs et rapport.
`CLAUDE_REPORT_MELODIA_V3.md` : audit commercial, changements, preuves, risques, décisions
restant au fondateur, ce qui n'a pas été déployé ni appliqué, lien PR ou comparaison.
