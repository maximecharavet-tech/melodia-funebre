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
