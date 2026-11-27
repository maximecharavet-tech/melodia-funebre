# Melodia Funèbre — Questionnaire famille (app Pro Android + PDF manuscrit)

Brainstorming à trois voix (développeur, commercial agences funéraires, designer UX/visuel). 27/11/2026.
Base : le questionnaire existant de la console Pro (`assets/js/pro/vues/questionnaire.js`, validation Rust `melodia-pro-wasm/src/questionnaire.rs`, table `pro_questionnaires.donnees` en JSONB). **On ne crée aucun nouveau modèle de données** : l'app et le PDF reprennent exactement les mêmes sections et les mêmes clés, pour que chaque réponse arrive telle quelle dans le circuit de commande existant.

## 1. Ce qui existe déjà (lecture du dépôt `melodia-funebre`, main `b8aecab`)

- Console `/pro` : questionnaire en 7 étapes, sauvegarde IndexedDB + serveur versionné, mode « Remplir avec la famille » (gros caractères, sans prix ni notes internes), dictée vocale, repérage des coordonnées (jamais transmises à la composition), récapitulatif PDF.
- `apps/android/` : coquille Capacitor 7 qui **ouvre le site en ligne** (`server.url = https://melodia-funebre.fr/pro`). Sans réseau, elle affiche seulement `hors-ligne.html` : inutilisable dans un salon sans wifi.
- API : `POST /api/pro/dossiers` `{ action: 'questionnaire', id, donnees, version_base }` (jeton Supabase du conseiller), contrôle de version et limite de 60 000 caractères.
- Contact public du site : `contact@melodia-funebre.fr`. **Aucune adresse postale publiée** (mentions légales : « [adresse complète] » à compléter).

## 2. Décisions clés

| # | Décision | Porté par |
|---|---|---|
| 1 | **Mêmes 6 sections que la console**, dans le même ordre : 1 La personne · 2 Sa vie · 3 La musique · 4 La cérémonie · 5 Le message · 6 Consentements. L'étape 7 « Offre » (prix, paiement) **reste côté agence**, jamais devant la famille. | Dev + Commercial |
| 2 | Le PDF numérote chaque question (1.1, 1.2…) avec la **même numérotation que l'app** : la ressaisie d'un PDF reçu se fait question par question, sans erreur. | Dev |
| 3 | **App hors ligne d'abord** : formulaire embarqué dans l'APK (plus de dépendance au réseau), brouillons sur l'appareil, file d'envoi qui part au retour du réseau vers l'API existante. | Dev |
| 4 | **Mode famille par défaut** : la tablette se tend à la famille ; un appui long sur le logo (ou code agence) rouvre le mode conseiller. Aucun prix, aucune note interne visible en mode famille. | Commercial + UX |
| 5 | **Ton** : vouvoiement, phrases courtes, aucune exclamation, aucun mot commercial. Chaque question peut être laissée vide (« Vous pouvez passer cette question »). On parle de « la personne », jamais « du défunt » côté famille. | Commercial + UX |
| 6 | **Visuel** : ivoire `#f4f1ea`, or de la charte (`#c9a84c`, `#806a30` sur ivoire), encre `#17150f` ; Cormorant Garamond pour les titres, Jost pour le texte (polices déjà dans le dépôt, licence OFL). Logo officiel `lockup-officiel.png`, jamais redessiné. Pas d'animation tape-à-l'œil : fondus de 200 ms maximum, `prefers-reduced-motion` respecté. | UX |
| 7 | **Tablette ET téléphone** : une colonne sur téléphone, deux colonnes sur tablette paysage ; cibles tactiles ≥ 48 px ; texte 18 px minimum en mode famille ; contraste AA. | UX |
| 8 | **Marque partenaire** : nom (et logo plus tard) de l'agence en haut de l'app et dans le cadre « tampon » du PDF ; Melodia reste signataire (« composé par Melodia Funèbre »). | Commercial |
| 9 | **RGPD** : case de consentement obligatoire (texte repris de la console), droit à l'image et page mémorial en options explicites ; les proches cités seulement avec leur accord ; coordonnées repérées et retirées de la composition. | Dev + Commercial |
| 10 | **PDF manuscrit** : A4, 5 pages, encre légère (fond ivoire très clair, imprimable en noir et blanc), lignes de 9 mm pour l'écriture, cases à cocher de 4,5 mm, cadre référence + cadre tampon agence, retour par l'agence ou scan/photo à `contact@melodia-funebre.fr`. | UX + Commercial |

## 3. Liste des champs (clés JSON existantes)

1. **La personne** (`defunt`) : prenom* · nom · surnom · prononciation · genre* (il/elle/iel) · naissance · deces · lieux · langues · langue_refrain
2. **Sa vie** (`vie`) : metier* (ou passion) · passion · traits* (12 choix + traits_libre) · habitude · anecdote · phrase · aimait · proches · proches_consentement · eviter
3. **La musique** (`musique`) : style* (13 styles) · artistes (ambiance seulement, jamais imités ni cités) · energie (0–100 → 5 crans sur papier) · voix* · instruments · instruments_eviter (12) · duree (≈ 2 min 30 / 3 min 30 / 4 min 30)
4. **La cérémonie** (`ceremonie`) : rite (9) · texte (prière, poème, verset) · moment (7) · date_ceremonie · date_limite* · contraintes (réservé agence)
5. **Le message** (`message`) : ton* (5) · refrain · titre · adresse (tu / il-elle / nous)
6. **Consentements** (`consentements`) : rgpd* · relecture_famille* · droit_image · visibilite* (lien privé / code / publique / pas de page)
+ Agence (hors `donnees`, cadre papier et en-tête app) : agence, conseiller, téléphone/e-mail de l'agence, référence dossier, interlocuteur famille.

`*` = obligatoire pour lancer la composition (règle du noyau Rust, inchangée).

## 4. Voix du commercial (agences)

- Argument n° 1 : « 10 minutes avec la famille, sans connexion, et Melodia s'occupe du reste ». Le PDF sert quand la famille veut réfléchir chez elle : l'agence le laisse avec l'enveloppe du dossier.
- Le cadre tampon fait du PDF un document **de l'agence** : elle le donne volontiers, c'est sa prestation.
- Pas de prix sur le PDF ni en mode famille : l'agence fixe son prix de revente.
- Ordre émotionnel : on commence par le prénom et les souvenirs, on finit par l'administratif (consentements). Jamais l'inverse.

## 5. Voix du développeur (stack)

- **Capacitor 7 (MIT)**, déjà utilisé dans `apps/android/` → pas de nouvelle techno, même identité Android possible. Nouveau projet séparé `apps/questionnaire-android/` pour ne pas casser la coquille actuelle.
- Formulaire en HTML/CSS/JS sans framework, données = objet `donnees` identique à la console. Stockage : `localStorage` + IndexedDB (brouillons), export JSON partageable.
- Synchronisation : appel à `POST /api/pro/dossiers` avec le jeton du conseiller. **Dans le prototype, l'envoi est préparé mais désactivé** (aucun appel réseau, aucune variable d'environnement, aucune migration).
- Alternative étudiée : Expo/React Native — écartée (deuxième pile à maintenir, plus lourde, aucun gain visible ici).
- Évolution : à terme, fusionner avec la console `/pro` en embarquant ses modules (`questionnaire.js`, noyau WASM) dans l'APK.

## 6. Voix du designer

- Écran d'accueil : logo, nom de l'agence, « Une vie, une chanson », un seul bouton « Commencer avec la famille ».
- Une section par écran, barre de progression fine dorée, retour toujours possible, « Enregistré sur cet appareil » discret.
- Puces de choix (traits, instruments, styles) plutôt que listes déroulantes : on touche, on ne fouille pas.
- Fin : « Merci. » + récapitulatif lisible, puis remise de la tablette au conseiller.
- PDF : même grammaire visuelle (filets or, numéros en petites capitales, beaucoup de blanc), lignes d'écriture gris chaud, pas d'aplats sombres (impression bureautique).

## 7. À décider par Maxime

1. Adresse postale de retour du PDF (aucune n'est publiée sur le site) — ou retour uniquement via l'agence / e-mail.
2. Adresse e-mail de retour : `contact@melodia-funebre.fr` (celle du site) ou une boîte dédiée.
3. Signature Android (clé de publication) et diffusion : APK direct aux agences ou Play Store (compte développeur payant, 25 $).
4. Activation de la synchronisation réelle vers l'API Pro (connexion conseiller dans l'app).
5. Logo de l'agence partenaire dans l'app (upload depuis la console) : V2.
