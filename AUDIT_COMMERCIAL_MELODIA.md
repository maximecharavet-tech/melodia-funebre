# Audit commercial — Melodia Funèbre

12 novembre 2026 · branche `claude/melodia-v2-succes-20261112`
Périmètre : site public, offres et tunnel PayPal, console Julie, application `/pro`.
Méthode : lecture du dépôt (générateur `build/`, pages construites, scripts, routes `api/`).
Aucun chiffre de trafic ni de vente n'était disponible : les priorités reposent sur l'impact
attendu, le risque et l'effort, pas sur des mesures.

Légende : **P0** à traiter avant toute campagne · **P1** ce trimestre · **P2** ensuite.
✅ = implémenté dans cette PR · 📝 = décision ou action de la maison, rien n'a été inventé.

---

## Synthèse

Le site est déjà au-dessus du marché : ton juste, catalogue de 21 œuvres réelles écoutables,
réassurance SACEM, pages de requête distinctes, données structurées riches, générateur
discipliné. **Ce qui freine la vente, ce n'est pas la vitrine mais trois manques de
confiance et une incohérence de modèle** :

1. **Mentions légales incomplètes** (SIRET, adresse, forme juridique, médiateur de la
   consommation) : c'est le premier endroit qu'ouvre une agence avant de signer, et une
   obligation légale pour la vente aux particuliers. 📝 P0
2. **Paiement par lien PayPal.me personnel** (le SDK n'est pas configuré) : la famille quitte
   le site vers un compte qui porte un pseudonyme, sans retour automatique. 📝 P0
3. **Aucune porte vers `/pro` depuis le site** : la console agence (démonstration publique
   comprise) est invisible. ✅ P0 (liens posés ; mise en ligne de `/pro` après fusion)
4. **Deux modèles B2B qui se contredisent** : le site promet « 60 % pour l'agence » sur le prix
   famille ; `/pro` fait payer l'agence (tarifs TBD). 📝 P0 (voir B2B-1)

---

## 1. Conversion — familles

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| C-1 | La page Offres dit ce qui est inclus, pas **ce qui se passe après le paiement**. Une famille en deuil achète d'abord une prise en charge. | Bloc « Après votre commande » : rappel sous 2 h ouvrées → entretien de 5 min → œuvre 24 h après l'entretien → révision. Uniquement des délais déjà publiés. | P0 | ✅ |
| C-2 | « Paiement PayPal et carte bancaire » : faux en pratique tant que le SDK n'est pas branché (lien PayPal.me). | Formulation exacte : « Paiement sécurisé par PayPal ». Rétablir la mention carte quand `PAYPAL_CLIENT_ID` sera renseigné. | P0 | ✅ |
| C-3 | Le tunnel compte 6 étapes et 15 champs (5 obligatoires). Le portrait (étape 3) est le plus long, alors que l'entretien téléphonique recueille de toute façon ces informations. | Rendre l'étape 3 explicitement facultative (« vous pourrez tout nous dire au téléphone ») et permettre de passer directement au contact. Test A/B souhaitable. | P1 | 📝 |
| C-4 | Bouton « Enregistrer et régler après l'entretien » : excellent pour la confiance, mais présenté comme second choix. | Le présenter comme option à part entière (« Réserver l'entretien, régler ensuite »), surtout la nuit et le week-end. | P1 | 📝 |
| C-5 | Pas d'appel à l'action entre la grille de prix et le comparatif pour qui hésite. | Ligne « Vous hésitez entre deux offres ? Être rappelé » sous la grille. | P1 | ✅ (dans C-1) |
| C-6 | Témoignages : 4, dont un anonyme (« Directeur d'agence — Lyon »). Pas de volume affiché. | Ne publier que des témoignages vérifiables (prénom + ville + accord écrit) ; afficher un nombre réel de familles servies quand la maison le souhaite. Ne rien inventer. | P1 | 📝 |
| C-7 | « Nous n'avons trouvé aucune autre maison française… » : affirmation comparative fragile. | La garder si elle est vérifiée et datée ; sinon la retirer. | P2 | 📝 |
| C-8 | Droit de rétractation de 14 jours affiché, alors qu'une œuvre personnalisée en est légalement exclue (art. L221-28 3° du Code de la consommation). | Valider avec un juriste : soit garder le geste commercial en le nommant comme tel (« garantie »), soit corriger les CGV. | P1 | 📝 |

## 2. Pricing

Prix publics conservés tels quels : **Essentiel 149 €, Prestige 299 €, Mémorial 499 €**.
Rien n'a été modifié ni inventé.

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| P-1 | Les prix vivent à trois endroits : `assets/data/content.json`, `build/data.js`, et en dur dans `assets/js/order.js:16-20`. | Faire lire à `order.js` les prix du DOM (comme pour les options) : une seule source de vérité. | P1 | 📝 |
| P-2 | L'ancrage fonctionne (Prestige « Le plus choisi »), mais « Le plus choisi » n'est vrai que si les ventes le confirment. | Garder si c'est vérifié ; sinon « Notre recommandation ». | P1 | 📝 |
| P-3 | Options (7 min, instruments rares, langue, plaque QR, 6 h) : bien conçues, peu visibles avant le tunnel. | Les rappeler dans le comparatif (déjà partiellement fait). | P2 | 📝 |
| P-4 | Revenus récurrents : aucun. | Pistes sans nouveau prestataire : (a) plaque QR + page mémoriale avec date anniversaire (rappel par courriel à la famille, opt-in) ; (b) « de son vivant » (déjà en place) en offre de prévoyance avec les agences ; (c) réédition en coffret pour la famille élargie. Tarifs : 📝 TBD. | P2 | 📝 |

## 3. SEO on-page

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| S-1 | `/offres` contient une FAQ mais aucun balisage `FAQPage`. | Ajout du `FAQPage` (mêmes questions que la page). | P0 | ✅ |
| S-2 | `/professionnels` (page B2B principale) n'a qu'un fil d'Ariane en données structurées. | Ajout de l'entité `Organization`, d'un `Service` B2B et du `FAQPage` des questions agences. | P0 | ✅ |
| S-3 | `/demos` annonce « 20 hommages » quand le catalogue compte 21 œuvres. Vérifié : le titre est déjà calculé, et la 21ᵉ œuvre est un message « de son vivant », rangé à part. | Aucun changement : c'est juste. | — | vérifié |
| S-4 | Pas de page « pompes funèbres par ville » ni de page « tarifs agences ». | Pages par bassin seulement le jour où des agences partenaires y sont réelles (sinon contenu creux, pénalisé). | P2 | 📝 |
| S-5 | Maillage : aucun lien vers `/pro`, la démonstration ou l'ouverture de compte agence. | Liens posés depuis `/professionnels` et le pied de page. | P0 | ✅ |
| S-6 | Pas d'`AggregateRating` : bien. N'en ajouter qu'avec de vrais avis collectés (plateforme tierce). | — | P2 | 📝 |

## 4. B2B — pompes funèbres

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| B2B-1 | **Incohérence de modèle.** Public : « l'agence conserve 60 % du prix payé par la famille » (Prestige 299 € → 179,40 € pour l'agence). `/pro` : l'agence paie Melodia (tables `pro_offers`, `price_cents` NULL). | Pour tenir la promesse publique, **le tarif agence de chaque offre doit valoir 40 % du prix famille** de la même offre, et rien d'autre. C'est une règle de cohérence, pas un prix inventé : 📝 la maison saisit les montants dans `/pro` → Admin → Offres. | P0 | 📝 |
| B2B-2 | Aucun lien vers la console `/pro`, alors qu'elle a une **démonstration publique** (`/pro?demo=1`, sans compte). | Bloc « La console des agences » sur `/professionnels` : démonstration, ouverture du compte agence (`/compte?retour=/pro`), essai d'une composition. | P0 | ✅ |
| B2B-3 | Deux promesses d'essai : « première composition offerte » (FAQ B2B) et « un essai de 2 min 30 par agence » (`/pro`). | Aligner le texte : un essai par agence, extrait de 2 min 30, gratuit. Fait dans la FAQ B2B. | P0 | ✅ |
| B2B-4 | Inscription agence par formulaire `/api/lead` uniquement, rappel manuel. | Garder le formulaire (rassurant pour un premier contact) et offrir la voie autonome via `/pro` (B2B-2). | P1 | ✅ |
| B2B-5 | Pack promo PDF et kit d'affiches : présents et bien présentés. | Ajouter le logo de l'agence sur la brochure (co-branding, déjà prévu côté `/pro`). | P2 | 📝 |
| B2B-6 | « Exclusivité territoriale » : levier fort, mais non outillé (pas de carte, pas de règle écrite). | Écrire la règle (nombre d'agences par bassin) dans les conditions partenaires. | P1 | 📝 |

## 5. Confiance

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| T-1 | `mentions-legales.html` : forme juridique, adresse, SIRET vides ; `cgv.html` : médiateur « à désigner » ; `confidentialite.html` : adresse du siège vide. | Renseigner. Le médiateur de la consommation est **obligatoire** (art. L612-1). | P0 | 📝 |
| T-2 | Paiement vers `paypal.me/<pseudonyme>`. | Brancher le SDK PayPal avec un compte professionnel au nom de la maison (`PAYPAL_CLIENT_ID`, identifiant public). | P0 | 📝 |
| T-3 | Pas de numéro de téléphone public (choix assumé : rappel sous 2 h). | Acceptable pour les familles ; pour les agences, un numéro direct est attendu. | P1 | 📝 |
| T-4 | **Marque blanche** : `confidentialite.html` nommait un fournisseur d'IA. | Remplacé par la catégorie de destinataire (« prestataire européen d'aide à la rédaction »), ce que permet l'article 13 du RGPD. Liste nominative tenue à disposition sur demande. À valider par le conseil de la maison. | P0 | ✅ |
| T-5 | La console maître (`dashboard-master.html`, usage interne) nomme les outils de composition. | Interne au fondateur : conforme à la règle (noms de fournisseurs côté serveur et outils internes seulement). | — | — |
| T-6 | Page « qui sommes-nous » avec photo du fondateur : bon. | Ajouter l'adresse postale (dès T-1). | P1 | 📝 |

## 6. Console Julie (commerciaux)

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| J-1 | Séquences, tâches et objectifs dépendent de la migration 09, qui a échoué en production. | Migration **11** prête (helpers `app.*`, commercial autorisé), prouvée en local, **non appliquée**. | P0 | ✅ (fichier) / 📝 (application) |
| J-2 | Le commercial n'avait aucun lien vers la démonstration `/pro` à montrer en rendez-vous. | Lien public `/pro?demo=1` désormais sur `/professionnels`, citable dans les modèles de courriel. | P1 | ✅ |

## 7. Application `/pro`

| # | Constat | Changement | Prio | État |
|---|---|---|---|---|
| A-1 | Toutes les fonctions serveur tombaient (`ERR_REQUIRE_ESM`). | Corrigé et prouvé (voir `CLAUDE_REPORT_MELODIA_V2.md`). | P0 | ✅ |
| A-2 | Réglages serveur manquants en production (code maître, clés de paiement, clé de composition, sel, plafonds). | Liste dans le rapport ; 📝 à créer par la maison, jamais dans le code. | P0 | 📝 |
| A-3 | Tarifs agence TBD. | Voir B2B-1. | P0 | 📝 |
| A-4 | Essai 2 min 30 : bon levier d'activation. | Mesurer le passage essai → première commande payée dans Admin. | P1 | 📝 |

---

## Ordre d'exécution recommandé

1. Fusionner cette PR, déployer (la maison), vérifier `/api/music-config` et `/api/pro/me`.
2. Remplir les mentions légales et désigner le médiateur (T-1).
3. Brancher PayPal professionnel (T-2) — la formulation « carte bancaire » pourra revenir.
4. Fixer les tarifs agence à 40 % du prix famille (B2B-1), puis ouvrir `/pro`.
5. Appliquer la migration 11 (éditeur SQL, par le fondateur).
6. Lancer la prospection Julie avec la démonstration `/pro` comme pièce maîtresse.
