# Rapport — Melodia Funèbre Pro v4 (console `/pro`)

12 novembre 2026 · branche `claude/melodia-pro-visuel-20261112`, partie de la v3 (`73bda66`).

**Rien n'a été poussé, fusionné ni déployé. Aucune migration n'a été écrite ni appliquée. Aucune variable d'environnement, aucun DNS, aucune région n'ont été touchés. Aucun service payant n'a été appelé. `api/*` n'a pas été modifié** (donc rien à craindre pour `ERR_REQUIRE_ESM`). Aucun logo, aucun portrait n'a été généré.

## 1. Ce qui a changé

La console reste du JavaScript natif sans dépendance (même architecture qu'en v3). Tout est côté navigateur ; la couche serveur n'a pas bougé.

### Visuel
- **Thème clair et sombre**, au choix (automatique par défaut, bouton dans l'en-tête, touche `T`, réglage dans les paramètres). Appliqué avant le premier affichage par un petit script externe (`theme-init.js`), donc sans flash, et compatible avec la CSP de `/pro` (aucun script en ligne).
- Charte conservée : or en filets et en italiques, jamais en aplat ; boutons ivoire cerné d'or en sombre, encre cerné d'or en clair.
- Icônes dessinées pour le dépôt (trait fin, 24 px), remplaçant les glyphes Unicode ; barre latérale avec repère d'onglet actif, onglets du bas sur mobile avec menu « Plus » (toutes les sections étaient jusque-là inatteignables sur téléphone sans lien direct).
- Cartes avec relief léger, tableau à cadre arrondi, puces avec compteurs, frise d'avancement, halo discret en haut de page.

### Fonctionnalités pour les agences
| Demande | Livré |
|---|---|
| Tableau de bord des dossiers | Recherche sans accents (prénom, référence, titre), filtres rapides avec compteurs, filtre par état, par date de cérémonie, tri (récent, cérémonie la plus proche, prénom, état), colonnes triables, vue liste ou suivi |
| Statuts, timeline | Frise de six étapes sur la fiche (l'étape qui attend un geste pulse), historique daté avec temps relatif |
| Duplication | « Dupliquer comme modèle » (fiche et liste) : ouvre un nouveau questionnaire avec le style musical, le rite et le mode du précédent. **Rien de la personne n'est repris** (testé : identité, vie, message, dates, lieux, consentements) |
| Export CSV / compta | CSV de la liste (ou de la sélection), séparateur `;`, BOM pour Excel, formules neutralisées. L'export comptable mensuel existant est inchangé |
| Aperçu audio avec forme d'onde | Lecteur maison : décodage, 240 barres (valeur efficace, normalisée), clic et glisser pour chercher, clavier (espace, flèches, début/fin), un seul lecteur à la fois. Si le fichier ne se décode pas, simple ligne de progression : **aucune onde n'est jamais inventée** |
| Raccourcis clavier | `Ctrl/⌘ K` palette de commandes (pages, actions, dossiers), `/` recherche, `N` nouveau, `G` puis `J/D/S/B/Q` navigation, `T` thème, `P` présentation, `?` aide |
| Onboarding guidé | Visite guidée en 5 bulles ancrées aux vrais éléments (une seule fois, relançable depuis l'aide ou la palette) + liste « Bien démarrer » sur Ma journée dont les étapes se cochent d'après ce que l'agence a réellement fait |
| Centre de notifications | Cloche avec compteur et panneau ; les notifications sont **dérivées de l'état réel des dossiers** (paroles à relire, chanson livrée, cérémonie sous 48 h non livrée, reprise par la maison, paiement non confirmé) ; « lu » gardé sur l'appareil |
| Mode présentation famille | Plein écran calme : prénom, années, titre, lecteur à onde, paroles à la demande, signature « Composé par Melodia Funèbre » + nom de l'agence. Aucun prix, statut ni note interne |
| Partage QR / lien | Bloc « Partager avec la famille » sur la fiche : lien, copie, partage natif, QR de lecture à l'écran ; lien vers le studio QR existant pour les impressions |
| Marque blanche agence | Couleur d'accent (6 choix, chacun avec une teinte pour le clair et une pour le sombre, contraste ≥ 4,5:1 testé), nom d'affichage, signature — **gardés sur l'appareil** (voir § 4) |
| Statistiques | Nouvelle page : dossiers ouverts, livrés, taux de livraison, délai médian, cérémonies à venir, dossiers par mois, répartition par état. Tout est calculé sur les dossiers de l'agence ; chaque graphique a son tableau de valeurs |

### Animations
Montée des blocs à l'entrée de chaque vue (Motion, déjà là), squelettes à la forme de la vue (tuiles, tableau), compteurs qui montent, anneau de progression, histogramme et répartition qui se déploient, forme d'onde qui apparaît et dont la tête de lecture respire, pulsation des états « en cours », micro-interactions (survol, appui, ouverture des panneaux). `prefers-reduced-motion` est respecté en CSS **et** en JS (valeurs finales posées d'emblée, aucun mouvement). Je n'ai pas utilisé l'API View Transitions : les vues se remplissent de façon asynchrone et elle aurait ajouté de la latence pour un gain faible.

### Démonstration `/pro?demo=1`
Elle montre toutes les nouveautés : sept **dossiers d'exemple** (pastille « Exemple », bandeau explicite) couvrant les états brouillon → livré, dont une cérémonie sous 48 h, avec une vraie chanson de démonstration de la maison pour la forme d'onde. Boutons « Repartir de zéro » et « Remettre les exemples » ; `?demo=1&vide=1` ouvre un compte vierge (utilisé par le test de bout en bout). Les statistiques de la démo sont calculées sur ces exemples et le disent. Les exemples ne comptent pas comme « premier dossier » dans la prise en main.

## 2. Contraintes respectées
- Aucune mention du fournisseur de musique ni du code maître dans ce que la console sert : testé (`tests/pro/console.test.mjs`, motifs assemblés car le dépôt interdit déjà de les écrire en clair).
- Pas de faux témoignage, de faux chiffre ni de fausse interface : les exemples sont étiquetés, aucun nombre n'est écrit en dur (le seul « 40 % / 60 % » est le repère commercial v3, déjà publié), aucune statistique d'écoute (nombre d'ouvertures) n'est inventée — la démo les met à zéro.
- Aucun HTML construit à partir de données saisies : le test échoue si une source en injecte, hors les deux SVG produits par notre propre code (QR).

## 3. Inspirations (aucun code copié)
Voir `THIRD_PARTY.md` (section « Pro v4 »). wavesurfer.js (BSD-3), cmdk et shadcn/ui (MIT), TanStack Table (MIT), Tremor (Apache-2.0), Shepherd.js / Driver.js (MIT), react-admin / Refine / Tabler (MIT), Motion (MIT, déjà embarqué). Tout est réécrit ; rien n'a été collé.

## 4. Décisions à prendre par Maxime
1. **Marque blanche côté serveur.** Aujourd'hui, la couleur, le nom d'affichage et la signature de l'agence restent sur l'appareil. Pour les partager entre collègues et les faire apparaître sur la page mémorial et dans les PDF, il faut des colonnes (`accent`, `nom_affiche`, `signature`) dans `pro_orgs` : **une migration, non écrite ici**. Oui / non ?
2. **Notifications push ou e-mail.** Le centre de notifications est interne à la console (affichage à l'ouverture). Alerter une agence quand les paroles sont prêtes demande un envoi serveur (e-mail transactionnel ou Web Push) : à arbitrer (coût, fournisseur).
3. **Statistiques d'ouverture des QR.** Le compteur existe côté mémorial mais la liste des dossiers ne le renvoie pas. L'afficher dans les statistiques demande d'étendre `GET /api/pro/dossiers` (petit changement CommonJS, sans migration) : à faire ?
4. **Duplication.** Je l'ai limitée à un « modèle » sans rien de la personne. Un vrai clone (par exemple pour une famille qui commande une seconde chanson) aurait un sens métier différent et touche des données sensibles : à confirmer avant de le faire.
5. **Visite guidée automatique.** Elle se lance à la première ouverture de chaque appareil. Préférez-vous un simple bouton dans l'aide ?
6. **Dossiers d'exemple dans la démo.** Je les ai jugés indispensables pour montrer filtres, statistiques et notifications. Si vous préférez une démo vierge par défaut, c'est une ligne (`?vide=1` devient le défaut).

## 5. Limites connues
- **Non testé contre l'API réelle** : la console v4 n'a été exercée qu'en démonstration (les adaptateurs `Api` et `Demo` ont le même contrat, et aucun appel serveur nouveau n'a été ajouté — la duplication passe par le brouillon local existant, et les notifications/statistiques lisent la liste des dossiers déjà renvoyée). À vérifier en préproduction : la forme d'onde sur un fichier servi par URL signée d'un autre domaine (elle demande que le stockage envoie les en-têtes CORS ; sinon le lecteur reste fonctionnel mais sans onde — repli prévu et visible).
- Le texte de la plupart des nouveaux écrans est écrit dans les vues, comme une partie de l'existant ; il n'a pas été passé dans `pro.fr.json` (sauf la navigation).
- Lighthouse et un audit d'accessibilité outillé (axe) n'ont pas été relancés sur la v4. Les contrastes des deux thèmes ont été choisis pour ≥ 4,5:1 (accents testés), les cibles font ≥ 44 px, les panneaux ont rôle et libellé, la palette suit le motif combobox, mais ce n'est pas une mesure.
- Pas de test sur Safari ni sur un vrai téléphone : Chromium seulement (390, 1024, 1440 px).
- Application Android et Windows non reconstruites (la console est servie par le web ; leur contenu embarqué n'a pas été touché).

## 6. Vérifications exécutées

| Suite | Commande | Résultat |
|---|---|---|
| Tests Node (API, pro, Julie, site) | `npm test` | **157 / 157** (dont 19 nouveaux pour la console : filtres, tris, CSV sûr, statistiques, frise, notifications, prise en main, duplication sans données personnelles, forme d'onde, contraste des accents, marque blanche, absence d'injection HTML, icônes existantes, mouvement réduit, absence de script en ligne) |
| Site | `npm run check` | vert |
| Console, parcours historique | `npm run test:e2e` (Playwright, Chromium, CSP de `/pro`) | **39 / 39** (le 40e contrôle, la relecture du PNG par jsQR, demande `JSQR` : non installé sur ce poste) |
| Console v4 | `npm run test:e2e:v4` | **17 / 17** : exemples, statistiques, palette, fiche (frise, onde dessinée, lecture/pause, QR), présentation sans donnée interne, duplication, filtres/tri/sélection/export CSV, notifications, thème mémorisé, marque blanche, aide, visite guidée, mobile sans débordement (cinq vues), mouvement réduit, aucune erreur de console |

`npm run pages` a été relancé : seul `sw.js` change (nouvelle empreinte de la console). Captures de la v4 : `docs/pro-app/captures-v4/`.

Au passage, un défaut de mise en page trouvé et corrigé : un texte réservé aux lecteurs d'écran, placé dans une colonne du tableau, élargissait la page de 190 px sur téléphone.

## 7. Fichiers

Nouveaux : `assets/js/pro/{logique,composants,icones,palette,notifications,visite,presentation,partage,theme,theme-init,actions-dossier}.js`, `assets/js/pro/vues/statistiques.js`, `tests/pro/console.test.mjs`, `tests/e2e/pro-v4.e2e.mjs`, `docs/pro-app/captures-v4/`.
Modifiés : `assets/css/pro.css` (réécrite), `pro.html`, `assets/js/pro/{app,ui,donnees}.js`, vues `journee`, `dossiers`, `fiche`, `bibliotheque`, `parametres`, `aide`, `qr` (une ligne), `assets/i18n/pro.fr.json`, `scripts/check.js`, `package.json`, `tests/e2e/pro.e2e.mjs` (compte vierge + visite déjà vue), `sw.js`, `THIRD_PARTY.md`.
