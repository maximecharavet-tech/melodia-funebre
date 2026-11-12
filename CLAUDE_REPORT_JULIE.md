# Rapport — Console collaborateur de Julie Serve

Branche `claude/melodia-julie-console-20261112` (départ `main` @ `ec3b9a1`).
**Rien n'est fusionné, rien n'est déployé, aucune migration n'est appliquée,
aucun secret / DNS / réglage Vercel ou GitHub n'a été touché.**

## 1. Ce qui a changé

### Envoi de bout en bout (`api/prospect-mail.js`, `api/_envoi-unique.js`)
- Protocole **réserver → envoyer → confirmer** : une ligne est réservée dans
  `envois_prospect` (clé unique) *avant* l'appel Resend ; seul le gagnant envoie.
- Le plafond quotidien n'a **pas** été réintroduit (le compteur du jour reste un affichage).
- Adresses **désabonnées** (`prospects.oppose`), **rejetées** (`prospects.rejete`) et
  celles dont un envoi a **rebondi / été signalé** (`envois_prospect.statut` = rejete|plainte)
  sont écartées avant tout envoi (une lecture par lot).
- En-tête `Idempotency-Key` transmis à Resend (filet supplémentaire contre un
  nouvel essai réseau).
- Erreurs visibles et actionnables dans la console (déjà envoyé, envoi incertain,
  journal injoignable, désabonné/rejeté, échec réessayable).
- Nouveaux modes de la route (tous derrière session + rôle commercial/master) :
  `deja` (état « déjà envoyé »), `automatisation` (état du cron, file, pauses),
  `sequence_enregistrer`, `sequence_sortie`.

### Déduplication stricte
- Clé = **adresse en minuscules + modèle** (sinon campagne, sinon objet normalisé)
  **+ `#e<étape>`** si étape de séquence. `Foo@Bar.com` = `foo@bar.com`.
  La clé est indépendante du collaborateur : deux collaborateurs ne peuvent pas
  non plus envoyer deux fois le même modèle à la même personne.
- Échec **net** du prestataire (4xx/5xx/429) → clé libérée (`statut = echec`), on peut réessayer.
- **Délai dépassé** (résultat inconnu) → `incertain` : le renvoi reste **bloqué**
  (« à vérifier dans Resend »). Journal en panne → envoi refusé (jamais de risque de doublon).
- Mode test : répétable, hors idempotence, toujours à soi-même.
- Stats : un envoi unique = un compteur ; `reserve` et `echec` ne sont pas comptés
  (journal serveur et tableau de bord).
- UI : bandeau « Déjà envoyé » + bouton d'envoi désactivé pour le couple destinataire + modèle ;
  le triage de « Ma journée » traite un 409 comme « déjà fait ».
- **Migration `supabase/migrations/20261114_12_envois_idempotence.sql`**
  (fichier seul, **non appliquée**) : colonne `cle_idempotence`, index UNIQUE,
  CHECK minuscules, statuts `reserve|incertain|echec`, reprise de l'existant
  (doublons historiques conservés mais sans clé). Prouvée sous PGlite.
  Sans elle : **mode dégradé** (verrou mémoire de l'instance + lecture du journal) — pas
  atomique entre instances Vercel ; la réponse porte alors une note explicite.

### Séquences automatisées (`api/sequences-cron.js`, `api/_sequences-serveur.js`)
- Le cron n'était qu'un squelette (il avançait des dates sans rien envoyer) **et**
  la console n'écrivait jamais les inscriptions en base : il n'y avait rien à traiter.
  Corrigé des deux côtés.
- **`SEQUENCES_AUTO` : sémantique inchangée** — exactement `'true'`, sinon le cron ne fait rien
  (testé avec `1`, `True`, `yes`, ` true`…).
- Quand `true` : par inscription due — sortie si opposé / rejeté / a répondu / statut terminal /
  sans adresse ; **verrou optimiste** (PATCH conditionnel) pour les crons concurrents ; envoi
  **via `/api/prospect-mail`** (rôle relu en base, STOP, idempotence) ; avance ou fin de séquence ;
  étape « appel » → tâche, aucun mail ; échec réessayable → reprises à +1 h, +4 h, +12 h puis
  **pause** avec motif ; incertain → pause immédiate ; échéances jamais un week-end ni avant demain.
- **Pas de plafond quotidien** ; anti-rafale : traitement en série (cadence Resend ≈ 2 req/s),
  budget 45 s et 80 inscriptions par passage, le reste au passage suivant.
- **Sécurité** : le cron exige `Authorization: Bearer <CRON_SECRET>`. L'en-tête `x-vercel-cron`
  seul n'est plus accepté (falsifiable, et il déclenche maintenant de vrais envois).
- Console « Mes séquences » : bandeau actif/désactivé, file « partira ensuite / partirait si
  l'automatisation était activée », pauses à reprendre. Inscrire écrit en base (propriétaire = session).
- Les journaux : chaque envoi laisse sa ligne (`sequence_id`, `etape`) ; chaque passage écrit une
  ligne console par inscription et renvoie le détail en JSON.

## 2. PDF « exemples de musiques + disque d'or »
- **Existaient-ils ?** Non. Aucun des 16 PDF de `documents/` (ni ceux de l'historique git, ni des
  branches `feat/brochures-julie-pieces-jointes`, `docs/brochures-v2-chatgpt`,
  `docs/brochures-surreal-juliet`, `feat/console-v2`, `cursor/*`, ni `/workspace/melodia-*`)
  ne présente les musiques du site avec le disque d'or : aucun fichier supprimé à restaurer.
  Les brochures existantes sont bien accessibles (kit + pièces jointes).
- **Créé** : `documents/melodia-brochure-ecoute-exemples.pdf` (4 pages A4, 1,6 Mo) généré par
  `build/pdf-ecoute.js` (`npm run pdf ecoute`). Couverture avec le disque d'or du site
  (CSS de `style.css`, non redessiné), puis les **21 musiques du catalogue** : titre, prénom/âge,
  style, **lien d'écoute cliquable + QR** vers `/ecouter/<titre>`. « Composé par Melodia Funèbre »,
  aucun nom de fournisseur, aucun témoignage ni chiffre.
- **Dans la console** : onglet Kit (téléchargement + « Aperçu dans un nouvel onglet ») et case à
  cocher parmi les brochures **jointes aux mails** (`ecoute-exemples`, côté serveur, client et
  `lib/prospect-outils.cjs`). La liste `includeFiles` de `vercel.json` (`documents/melodia-brochure-*.pdf`)
  l'embarque déjà.
- Régénération : `npm run pdf ecoute` (Playwright + Chrome ; `CHROME_PATH` ou `/usr/bin/google-chrome`
  sont désormais reconnus par `build/pdf.js`).

## 3. Rust / WASM
- `console-julie-wasm/src/dedupe.rs::cle_envoi_json` (export `envoi_cle`) : même clé que le serveur,
  glue `envoiCle`, repli `julie-fallback.js`, helper de test. **Parité testée** Rust ↔ serveur ↔
  repli JS (`lib/julie/dedupe.test.cjs`). `julie_v2.wasm` reconstruit et versionné.
- Build : `npm run build:wasm` (ou `cargo build --release --target wasm32-unknown-unknown` dans
  `console-julie-wasm/` puis copie du `.wasm`). Aucune crate ajoutée (`CREDITS-console.md` mis à jour).

## 4. Tests lancés
| Commande | Résultat |
|---|---|
| `node --test tests/api/envoi-unique.test.mjs` (24 : clé, concurrence ×20 et ×10, retry après succès, échec transitoire, incertain, journal en panne, mode dégradé, désabonné/rejeté…) | vert |
| `node --test tests/api/sequences-cron.test.mjs` (15 : drapeau, secret, envoi réel, 3 crons simultanés, rejeu après crash, reprises, pauses, 31 envois > ancien plafond…) | vert |
| `node --test tests/api/sequences-serveur.test.mjs` (3) | vert |
| `cargo test` (`console-julie-wasm`, 29) | vert |
| `npm run test:julie` | vert |
| `npm run test:sql` (PGlite installé dans `/tmp` : 47 preuves, dont celles de la migration 12) | vert |
| `npm run check` | vert |
| `npm test` | 170 / 171 — **1 échec préexistant** : `tests/pro/pipeline.test.mjs` « pipeline complet simulé » (Melodia Pro, hors périmètre ; vérifié : il échoue aussi sur `main` @ `ec3b9a1`) |

## 5. Décisions pour Maxime
1. **Appliquer la migration `20261114_12`** (éditeur SQL Supabase) : c'est elle qui rend
   l'anti-doublon atomique entre instances. À faire avant d'activer l'automatisation.
   La migration 11 (console v2) doit aussi être appliquée pour que séquences et inscriptions existent en base.
2. **Activer ou non `SEQUENCES_AUTO=true`** : je ne l'ai pas fait. Il faut aussi `CRON_SECRET`
   (Vercel l'envoie en `Authorization: Bearer` aux crons) et un bloc `crons` dans `vercel.json`
   (non ajouté), par exemple :
   `"crons": [{ "path": "/api/sequences-cron", "schedule": "40 7 * * 1-5" }]`
   (07:40 UTC = 08:40 Paris l'hiver, 09:40 l'été).
3. **Règle « jamais deux fois »** : stricte et *à vie* pour (adresse, modèle/étape) — pas seulement
   « le même jour » comme avant. Un modèle réutilisé volontairement des mois plus tard à la même
   personne sera refusé : choisir un autre modèle, ou me dire si une fenêtre (ex. 12 mois) est préférable.
4. **Envoi incertain** (délai dépassé) : bloqué sans libération automatique. Il n'y a pas de bouton
   « libérer » ; après vérification dans Resend, la ligne `incertain` se corrige en base
   (`statut = 'echec'`, `cle_idempotence = null`). À décider : veux-tu un bouton dans la console ?
5. **Limites Resend** : forfait gratuit 100 courriels/jour et 3 000/mois, tous envois confondus — seul
   plafond dur, non levé par le code. Si Julie lance de gros lots, le cron enchaîne puis reporte
   (+1 h, +4 h, +12 h, puis pause) au lieu de boucler.
6. **Séquences par propriétaire** : la clé naturelle d'une séquence serveur est (propriétaire, nom).
   Les séquences éditées dans le navigateur restent locales tant qu'on n'inscrit pas de prospects.
7. **Non tranché** : le sélecteur d'étapes de l'éditeur de séquences ne propose pas encore les
   brochures (le champ `brochures` de chaque étape est bien pris en compte côté cron, pas encore éditable).
   Le test `tests/pro/pipeline.test.mjs` à regarder séparément.

## 6. Rappel
Rien n'est fusionné ni déployé ; la migration 12 est un fichier, non appliquée ; aucune variable
d'environnement ajoutée ou modifiée ; les PR #29 et #30 n'ont pas été touchées.

---

# Pass 2 — PDF premium supplémentaires (console Julie)

## 7. Les quatre PDF (A4, noir / ivoire / or, polices embarquées via `fontes()`)
| Fichier (`documents/`) | Pages | Taille | Générateur |
|---|---|---|---|
| `melodia-presentation-agences-partenaires.pdf` | 6 | 2,3 Mo | `build/pdf-extra-agences.js` |
| `melodia-offre-pro.pdf` | 6 | 1,7 Mo | `build/pdf-extra-offre-pro.js` |
| `melodia-plaquette-ecoute-prestige.pdf` | 7 | 2,3 Mo | `build/pdf-extra-ecoute-prestige.js` |
| `melodia-fiche-contact-julie-serve.pdf` | 2 | 1,0 Mo | `build/pdf-extra-contact.js` |

- Socle commun : `build/pdf-extra-commun.js` (charte, QR, **verso avec la carte**). Aucun PDF existant n'est écrasé.
- **Reproductible** : `npm run pdf` les régénère tous ; `node build/pdf.js extra` (ou `agences`, `offre-pro`, `ecoute-prestige`, `contact`) un par un. Pipeline inchangé (HTML + Chromium + polices base64).
- Visuels : dérivés allégés (redimensionnés, jamais recadrés) dans `assets/pdf-extra/opt/`, produits par `scripts/optimiser-pdf-extra.py` (Pillow, à lancer seulement si on change un original). Les originaux restent intacts. But : chaque PDF < 2,5 Mo (limite pièce jointe).
- **Console** : onglet *Kit* (4 nouvelles lignes, téléchargement), et cases « brochures jointes aux mails » (ids `presentation-agences`, `offre-pro`, `ecoute-prestige`, `fiche-contact-julie`, côté serveur `api/_prospect-outils.js`, `lib/prospect-outils.cjs` et client `collaborateur-mails.js`). `vercel.json` : le `includeFiles` de `api/prospect-mail.js` embarque ces 4 fichiers (fichier du dépôt, pas un réglage Vercel). Envoi et dédup non touchés.

## 8. Carte de Julie Serve — sur CHAQUE PDF
`carte-julie-serve` (PNG original passé en JPEG q93 pleine définition 1659×948, jamais recadrée ni recouverte) :
- agences partenaires : p. 6 (verso), 170 mm de large ; offre Pro : p. 6 ; Écoutez prestige : p. 7 ;
- fiche contact : p. 1 (carte au centre de la page). Coordonnées + 2 QR (mailto, site) sous la carte.
Test automatique : `tests/api/pdf-extra.test.mjs` vérifie la présence de la carte dans chacun.

## 9. Visuels utilisés (`assets/pdf-extra/`)
colombe-vitrail (couv. agences), plaque-qr (couv. Pro, légende « photographie illustrative »), piano-lac (couv. Écoutez), souvenirs-violon (p. 2 Écoutez, affiche entière), violon-detail, fleurs, partition, bougies, colombe-detail, carte-julie-serve, disque d'or **CSS du site** (`cssDisque()` de `pdf-ecoute.js`, haute résolution). Non utilisés : lockup/monogramme (les couvertures portent déjà le logo), ceremonie, lys, gramophone, arches, salon-tourne-disque, crépuscule (retiré : logo fantôme intégré + visage coupé).
QR fonctionnels générés (encodeur du site) vers : `/ecouter`, `/ecouter/<titre>`, `/professionnels`, `/pro`, `/m/demo`, `mailto:julie@melodia-funebre.fr`. Les QR des photos ne sont jamais présentés comme scannables.

## 10. Contrôle visuel
Previews 150 dpi, une PNG par page : `documents/preview-pdf-extra/` (21 fichiers). Corrigé après lecture : visage/logo fantôme du bandeau crépuscule (remplacé) ; bandeau qui débordait en bas de page (Pro p. 3) ; notes de bas de page collées au cadre ; pages à moitié vides (blocs ajoutés, visuels agrandis) ; « 179,4 € » → « 179,40 € » ; citation coupée par un « » orphelin (espaces insécables) ; carte QR « Écouter en ligne » écrasée ; affiche violon trop petite ; formulations non étayées retirées (crématoriums/officiants).

## 11. Tests
| Commande | Résultat |
|---|---|
| `node --test tests/api/pdf-extra.test.mjs` (8 : catalogue serveur/console/kit/vercel.json, taille, carte, pas de Mureka/MASTERMAX) | vert |
| `npm run check` (après `npm run pages` pour les empreintes de cache des 2 JS modifiés) | vert |
| `npm run test:julie` | vert |
| `npm test` | 178 / 179 — seul échec : `tests/pro/pipeline.test.mjs` « pipeline complet simulé », **préexistant** (cf. §4) |
`cargo test`, `test:sql` : non lancés (ni Rust ni migration touchés).

## 12. Décisions pour Maxime
1. **Fond perdu** : les PDF sont au format A4 net, images pleine page jusqu'au bord, texte/QR/carte à ≥ 14 mm. Pas de fond perdu 3 mm ni de traits de coupe : à demander si imprimeur.
2. **Marges de crématoriums / marbriers / officiants** : le 60 % publié concerne les agences de pompes funèbres ; les PDF le disent et renvoient vers Julie pour les autres métiers. À trancher.
3. **Pas de numéro de téléphone** (aucun n'est publié) : seulement e-mail et site.
4. Les previews pèsent ~16 Mo ; supprimables du dépôt après relecture.
5. `plaque-qr.jpg` sert de couverture Pro : son QR est illustratif (mentionné).

## 13. Rappel
Rien n'est fusionné ni déployé ; aucune migration, variable d'environnement, DNS ou réglage GitHub/Vercel touchés ; `main` non poussé.

---

# Pass 3 — Déduplication sur 2 mois + envoi groupé personnalisé en un clic

**Fichiers uniquement : aucune migration n'est appliquée, rien n'est fusionné, rien n'est déployé, `main` n'est pas poussé.**
Ce pass **remplace** deux points des passes précédentes : la règle « jamais deux fois **à vie** » (§1 et décision n° 3 du §5) devient **60 jours**, et la migration 12 a été **réécrite en place** (elle n'était pas appliquée).

## 14. Ce qui a changé

### Déduplication : 60 jours glissants (décision de Maxime, non rediscutée)
- Même portée de clé qu'avant (adresse normalisée `lower(btrim(email))` + modèle / campagne / objet + `#e<étape>`). Un envoi bloquant interdit le même courriel à la même adresse pendant 60 jours ; **à 60 jours pile, le renvoi est permis** (nouvelle ligne, l'historique n'est pas réécrit).
- Statuts bloquants inchangés : `reserve`, `incertain`, `envoye`, `delivre`, `ouvert`, `clique`, `differe`, `rejete`, `plainte`. `echec` libère aussitôt ; `mode = 'test'` reste hors idempotence.
- `api/_envoi-unique.js` : `FENETRE_JOURS = 60`, `fenetreEnvoi()`, `dateFr()`, `libelleDeja()` ; la réservation renvoie le **précédent** et la **date de renvoi possible** (précédent + 60 j). Magasin mémoire (horloge injectable), magasin Supabase (fonction SQL), mode dégradé (journal des 60 derniers jours + verrou mémoire).
- Route `/api/prospect-mail` : refus `DEJA_ENVOYE` avec `precedent`, `renvoi` et un motif « Déjà envoyé le JJ/MM — renvoi possible à partir du … » ; le mode `deja` renvoie les mêmes dates + le texte. **Stats** : seuls les envois « réels » comptent (ni `reserve` ni `echec`) ; un renvoi après 60 jours compte comme un nouvel envoi.
- Cron / séquences : passent par la même route, donc la même fenêtre (testé : étape envoyée il y a 30 j → avance sans renvoi ; il y a 61 j → part).
- Noyau Rust/WASM : export `envoi_fenetre` (`dedupe.rs::fenetre_envoi_json`), glue `envoiFenetre`, repli JS `envoi_fenetre`. `julie_v2.wasm` reconstruit. La clé (`envoi_cle`) est inchangée : même portée, parité Rust ↔ serveur ↔ repli testée, y compris la frontière des 60 jours.

### Comment la fenêtre est garantie (base + concurrence)
Migration `20261114_12_envois_idempotence.sql` (réécrite en place), **deux couches** :
1. **`public.reserver_envois(jsonb)`** — *le* chemin de l'API (appel RPC, `service_role` seul). Dans une transaction : `pg_advisory_xact_lock(hashtextextended(clé))` (clés triées → pas d'interblocage), `SELECT` des envois bloquants des 60 derniers jours, `INSERT` de la ligne `reserve` s'il n'y en a pas. Deux requêtes concurrentes s'enchaînent : la seconde voit la ligne de la première et répond « déjà envoyé » avec les dates.
2. **Contrainte d'exclusion `btree_gist`** `(cle_idempotence =, tstzrange(envoye_le, bloque_jusqua) &&)` pour les statuts bloquants, `bloque_jusqua = envoye_le + 1440 h` posé par trigger. Même un `INSERT` direct qui contournerait la fonction, ou deux transactions que le verrou ne séparerait pas, sont refusés par Postgres (23P01) ; la fonction rattrape l'erreur et répond « déjà envoyé ».
- **Backfill** : plus d'index unique à vie. Seuls les envois des **60 derniers jours** reçoivent une clé (la ligne la **plus récente** par couple, qui bloque jusqu'à sa propre échéance) ; les plus anciens et les doublons historiques gardent leur trace sans clé et ne bloquent plus rien. Rejouable (testé sur un journal déjà repris).
- Limite honnête : PGlite n'a qu'**une** connexion ; la concurrence SQL y est prouvée par 20 appels simultanés (chacun sa transaction) **et** par la contrainte d'exclusion qui refuse tout chevauchement. La contention réelle sur le verrou consultatif n'y est pas exerçable ; la garantie en production repose sur le verrou + la contrainte, que Postgres applique quel que soit le nombre de connexions.
- Un `reserve` resté coincé (crash entre réservation et confirmation) bloque désormais **60 jours** (avant : à vie) puis se libère de lui-même.

### Envoi groupé personnalisé (console collaborateur → « Envoi groupé »)
- **Liste de contacts** (source : les prospects déjà chargés + les contacts importés) : personne (prénom / nom), e-mail, organisation, ville, statut. Organisation absente → « — » (jamais une fausse agence). Cases à cocher ; **« Tout sélectionner (affichés) »** = le sous-ensemble filtré et éligible seulement ; désabonnés, adresses absentes ou invalides non cochables.
- **Filtres** : recherche (nom, e-mail, organisation, ville ; sans accent ni casse), organisation, ville, statut.
- **Modèle** : parmi les 7 modèles Julie déjà proposés dans la console (le serveur compose le texte : ce qu'on voit est ce qui part).
- **Aperçu par destinataire** (navigation ◀ ▶ dans la sélection), rendu par le serveur (`mode: apercu`) : champs de fusion **prénom, nom, civilité, organisation** affichés ; **replis sûrs** : civilité + nom → « Bonjour Madame Dupont, » ; prénom → « Bonjour Marie, » ; rien ou nom de famille seul sans civilité → « Bonjour, » ; organisation absente → on n'invente rien (« votre maison », objet sans agence) ; jamais « undefined ». Aucun envoi depuis l'aperçu. Le nom de la personne est séparé en civilité / prénom / nom de famille sans rien inventer (`Mme Claire Dupont` ; un seul mot = nom de famille).
- **Un bouton « Envoyer à N personnes »** : une confirmation native (un « OK »), puis `lot_creer` et le traitement part seul. **Aucun clic par mail.**
- **File** (`api/_lot-envoi.js`, modes `lot_creer | lot_traiter | lot_etat | lot_reprendre | lot_annuler` de `/api/prospect-mail`) : un destinataire à la fois, pause de 700 ms (≈ 1,4 envoi/s, sous les ~2 req/s de Resend), **quota lu dans le journal** (jour et mois de Paris, tous envois du compte). À **100/jour** ou **3 000/mois**, arrêt propre : le reste passe en « reporté » et le bilan le dit (« 37 envoyés · 12 reportés faute de quota quotidien ») ; « Reprendre » (un clic, le lendemain) relance reportés + erreurs réessayables.
- **Même chemin que l'envoi unitaire** : chaque mail rappelle `handler` de `/api/prospect-mail` en mode `envoi` avec la session de Julie → rôle relu en base, désabonnés / rejetés écartés, réservation d'idempotence sur 60 jours. Pas de contournement. Une seule copie « maison » (LEAD_TO) par lot, pas une par destinataire.
- **Résultat par destinataire** : `Envoyé` / `Déjà envoyé (< 2 mois)` (sauté, avec dates) / `Désabonné` / `Erreur` (message actionnable) / `Reporté (quota)` / `En attente`. Une erreur n'arrête pas le lot ; session expirée, journal en panne ou envoi non configuré **arrêtent** le lot sans consommer de destinataire (reprise possible).
- **Barre de progression** + bilan chiffré + quota du jour / du mois.
- **Persistance** : le lot vit en base (tables `lots_envoi`, `lots_envoi_items`, migration 13). Après rechargement, la console relit le dernier lot (`lot_etat`) **sans rien relancer** ; un lot « en cours » attend un clic sur « Continuer l'envoi ». Sans migration 13 : lot gardé en mémoire de l'instance (signalé « état non partagé »), plus un instantané local sur l'appareil.
- **Un seul lot en cours par collaborateur** (index unique partiel + contrôle serveur) : un double clic ne crée pas deux lots. Deux onglets qui traitent le même lot ne se partagent jamais une ligne (prise conditionnelle) ; en plus, l'idempotence protège le destinataire.
- **Import de contacts par collage CSV** (dans la même vue) : première ligne = noms de colonnes (prénom, nom, e-mail, organisation, civilité, ville ; synonymes reconnus), **aperçu ligne par ligne** (nouveau / invalide / doublon dans le collage / déjà dans la liste), avertissements (sans nom, sans organisation), **écriture seulement après confirmation**, jamais d'écrasement, aucun envoi à l'import. Réutilise le parseur CSV du noyau Rust (`csvParser`, déjà testé dans `csv.test.cjs`) ; l'ancien import « Import CSV » (SIRENE) est conservé tel quel.
- Côté serveur, `varsNormalisees` gère `prenom`, `nom_famille`, `civilite_longue`, `organisation` en plus de `civilite` (formule après « Bonjour »), sans changer le comportement existant quand seul un nom complet est fourni.

## 15. Tests lancés
| Commande | Résultat |
|---|---|
| `node --test tests/api/envoi-unique.test.mjs` (37 : clé, 59 j bloqué, 60 j pile / juste au-delà autorisé avec horloge injectée, casse, autre modèle / étape, echec, incertain / reserve, test, ×20 dans la fenêtre → 0 envoi, ×20 après expiration → 1 seul, mode dégradé, stats) | vert |
| `node --test tests/api/lot-envoi.test.mjs` (19 : personnalisation et replis, aperçu, un clic → tout part, sélection vide / modèle inconnu / invalides, double création, doublons < 60 j sautés avec dates et > 60 j envoyés, désabonné, erreur partielle, arrêt session / journal, ×8 onglets sur un même lot, lot vs envoi unitaire concurrent, quota 98 → 2 envoyés / 3 reportés puis reprise, quota mensuel, permissions, persistance après « changement d'instance », migration 13 absente, annulation, une seule copie maison) | vert |
| `node --test tests/api/sequences-cron.test.mjs` (16, dont la fenêtre de 60 jours) | vert |
| `lib/julie/lot.test.cjs` (10 : nom → civilité/prénom/nom, filtres, « tout sélectionner » limité au filtré, import CSV) et `dedupe.test.cjs` (parité clé + fenêtre Rust/serveur/repli) — `npm run test:julie` | vert |
| `cargo test` (`console-julie-wasm`, 30), WASM reconstruit | vert |
| `npm run test:sql` (PGlite + btree_gist : **72 preuves**, dont fenêtre 59 j / 60 j − 1 s / 60 j pile, 20 appels simultanés avant et après expiration, exclusion sur INSERT direct, reprise du journal existant et rejeu, migration 13) | vert |
| `npm run check` (après `node scripts/empreintes.js dashboard-commercial.html`) | vert |
| `npm test` | 223 / 224 — seul échec : `tests/pro/pipeline.test.mjs` « pipeline complet simulé », **préexistant** (cf. §4), non touché |
Non vérifié : un parcours dans un vrai navigateur (la vue a été chargée sous Node avec un DOM factice, et ses fonctions pures sont testées) ; aucun mail réel ni appel réseau payant.

## 16. Fichiers de migration à appliquer, dans l'ordre
**Fichiers uniquement, non appliqués — pas de merge, pas de déploiement.** Pré-requis : `20261103_08_envois_prospect.sql` (journal) déjà présent en base. Ensuite, dans cet ordre :
1. `supabase/migrations/20261113_11_console_v2_app.sql` (séquences, inscriptions, tâches ; inchangée)
2. `supabase/migrations/20261114_12_envois_idempotence.sql` (**réécrite en place** : fenêtre de 60 jours, `btree_gist`, fonction `reserver_envois`)
3. `supabase/migrations/20261115_13_lots_envoi.sql` (**nouvelle** : lots et file d'envoi groupé — ajout distinct, pas une correction de la 12)

La 12 demande `create extension btree_gist` (disponible sur Supabase, droits du SQL Editor). Sans 12 : mode dégradé (verrou mémoire + journal 60 j, non atomique entre instances). Sans 13 : lots en mémoire de l'instance.

## 17. Décisions encore ouvertes (la fenêtre de 2 mois n'en fait pas partie)
1. **Pas de traitement en arrière-plan serveur** : le cron est coupé et Vercel n'a pas de processus long. La file avance **tant que la console est ouverte** ; fermer l'onglet met le lot en pause, « Continuer l'envoi » le reprend. Pour qu'il avance onglet fermé, il faudrait brancher le traitement des lots sur le cron (je ne l'ai pas activé) ou une file externe.
2. **Confirmation avant l'envoi** : j'ai gardé un `confirm()` (un « OK ») avant un envoi de masse. À retirer si Maxime veut un clic strictement unique.
3. **Quota partagé** : les 100/jour et 3 000/mois sont ceux du compte Resend ; le compteur lit `envois_prospect`, donc il inclut séquences, tests et envois unitaires. Un autre usage du compte Resend hors de ce journal n'est pas vu.
4. **Plafond par lot** : 500 destinataires (au-delà du quota quotidien le reste est reporté de toute façon).
5. **Modèles** : l'envoi groupé n'accepte que les 7 modèles Julie (le serveur seul sait les personnaliser).
6. **Contacts** : prénom / civilité ne sont pas des colonnes de la table `prospects` ; ils sont déduits du champ `dirigeant` (« Mme Claire Dupont »). Si Julie veut les saisir séparément en base, c'est une migration à décider.
7. Les `incertain` restent à corriger à la main en base (`statut = 'echec'`) après vérification dans Resend (inchangé, décision n° 4 du §5).

## 18. Rappel
Rien n'est fusionné ni déployé ; aucune migration appliquée ; aucune variable d'environnement, secret, DNS, réglage Vercel ou GitHub touché ; `QUANT_LIVE_ENABLED` et `SEQUENCES_AUTO` non touchés (cron toujours inerte) ; `main` non poussé ; aucun mail réel envoyé.
