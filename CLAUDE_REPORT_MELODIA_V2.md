# Rapport — Melodia Funèbre v2

12 novembre 2026 · branche `claude/melodia-v2-succes-20261112` (depuis `main` `d21604e`)

**Rien n'a été fusionné, déployé, promu ni annulé. Aucune migration n'a été appliquée. Aucune
variable d'environnement, aucun DNS, aucune région, aucune facturation n'a été touchée. Aucun
service payant ni aucun générateur d'images n'a été appelé.**

## Pull request

**Non ouverte : `gh` n'est pas installé sur ce poste.** Conformément à la consigne, la branche a été
poussée sans autre détour. Pour ouvrir l'unique PR (titre :
`Melodia v2 : hotfix ESM + succès commercial + design Motion/3D`) :
<https://github.com/maximecharavet-tech/melodia-funebre/compare/main...claude/melodia-v2-succes-20261112>

## Commits

| # | Commit | Contenu |
|---|---|---|
| 1 | Plan | `PLAN_MELODIA_V2.md` |
| 2 | **Hotfix ESM** | `lib/pro` en CommonJS, `export.js` réparé, test de chargement |
| 3 | Migration 11 | nouveau fichier ; 09 intact ; preuves PGlite |
| 4 | Audit | `AUDIT_COMMERCIAL_MELODIA.md` |
| 5 | Socle design | Motion et three.js réduits, `recueil.js`, `lumiere-3d.js`, `THIRD_PARTY.md` |
| 6 | Pages | gains rapides commerciaux + intégration du design, pages régénérées |
| 7 | Visuels | placeholders v2 + `VISUELS_A_GENERER.md` |
| 8 | Marque blanche | documents internes et code serveur retirés du site servi |
| 9 | Rapport | ce fichier |

---

## 1. Hotfix ESM (prouvé avant tout le reste)

### Cause

`package.json` n'a pas de `"type": "module"`. Vercel compile donc chaque `api/**/*.js` écrit en
`import`/`export` vers **CommonJS**. La sortie de `vercel build` le dit : « Compiling … from ESM to
CommonJS ». Chaque `import` devient un `require()`. Depuis la PR #27, 21 fonctions faisaient
`require()` de `lib/pro/*.mjs`, d'où **`ERR_REQUIRE_ESM`** au chargement :

- les 17 routes `api/pro/*` ;
- 4 routes de l'atelier public : `generate-music`, `generate-lyrics`, `music-status`, `music-config`.

Second défaut, indépendant : `api/pro/export.js` contenait `import export from …`. `export` est un
mot réservé, donc le fichier ne se chargeait dans aucun format.

### Correctif

`lib/pro/**/*.mjs` passe en `.cjs` (renommage `git mv`, historique conservé) avec `require` /
`module.exports`. C'est le mode déjà éprouvé en production par les 18 autres fonctions.

- `noyau.cjs` : `__dirname` remplace `import.meta.url`.
- `api/**` pointe désormais vers les `.cjs`.
- `export.js` est corrigé.

Cette solution ne dépend ni de la version de Node (`require(esm)`), ni de la détection de syntaxe.
Elle ne demande pas non plus de `"type": "module"` racine, qui casserait `build/`, `scripts/` et la
colle UMD.

### Preuves

| Épreuve | Commande | Résultat |
|---|---|---|
| Test de chargement **sur `main`** (contre-épreuve) | `node --test tests/api/chargement.test.mjs` | ❌ 21 × `ERR_REQUIRE_ESM` + `SyntaxError` sur `export.js` : la panne de production est reproduite |
| Même test sur la branche | `npm run test:api` | ✅ toutes les fonctions : graphe CommonJS sans `.mjs`, chargement réel avec `--no-experimental-require-module` |
| `vercel build` de `main` (Docker `node:22-bookworm`) + chargement de chaque `.func` | `npx vercel@latest build` puis `node --no-experimental-require-module sonde-func.cjs` | ❌ 34 fonctions, 21 en échec (`ERR_REQUIRE_ESM`) |
| `vercel build` de la branche, même sonde | idem | ✅ **34 fonctions, 0 en échec**, avec ou sans `require(esm)` |
| Noyau Rust/WASM dans les fonctions construites | `sonde-noyau.cjs` (fichiers `filePathMap` matérialisés) | ✅ `version 0.1.0` dans `scan`, `checkout`, `qr` ; `_courrier.js` bien embarqué dans `admin` |
| Routes musique : l'authentification reste en place | `npm run test:pro` (`securite.test.mjs`) | ✅ sans jeton → 401 ; agence ou commercial → 403 ; atelier et master passent ; origine étrangère refusée |

`vercel build` a tourné hors ligne, avec un `.vercel/project.json` local fictif, dans un dossier
temporaire. Aucun lien vers le projet, aucun téléversement.

## 2. Migration 09 → nouveau fichier `20261113_11_console_v2_app.sql`

- `20261111_09_console_v2.sql` n'a pas été modifié.
- `public.est_master()` est remplacé par **`app.est_master()`**.
- `public.est_maison()` est remplacé par **`(app.est_master() or app.mon_role() = 'commercial')`**,
  et **non** par `app.est_maison()`. Depuis S1, `app.est_maison()` vaut « master ou atelier » et
  exclut le commercial. Avec elle, Julie n'aurait plus pu créer ses séquences ni ses tâches.
- Un garde-fou en tête lève une erreur si les helpers `app.*` manquent. La migration est
  idempotente.

Preuve, locale uniquement : `NODE_PATH=/tmp/pglite-melodia/node_modules node scripts/prouver-migrations.mjs`
donne **35/35**. Elle s'appuie sur une base « comme la production », sans alias `public.est_*` :

- 09 y échoue avec `function public.est_master() does not exist`, et rien ne subsiste après
  l'annulation ;
- 11 passe, puis se rejoue sans erreur ;
- le commercial crée ses séquences et ses tâches, mais rien au nom d'un autre ;
- le partenaire ne crée rien et ne lit rien ; le fondateur lit tout ;
- `melodia_capacites().console_v2 = true` ;
- S1 tient toujours : le commercial ne lit pas les commandes.

**Non appliquée.** Le mode d'emploi pour le fondateur est en tête du fichier : éditeur SQL d'abord,
puis, seulement ensuite et si l'outil le réclame, `migration repair` pour marquer 09.

## 3. Audit commercial et gains rapides

Voir `AUDIT_COMMERCIAL_MELODIA.md`. Changements implémentés, tous à faible risque :

- **/offres**
  - Nouveau bloc « Après votre commande », qui ne reprend que des délais déjà publiés.
  - « Paiement sécurisé par PayPal » remplace la mention « carte bancaire », que le lien PayPal.me
    actuel ne garantit pas.
  - `FAQPage` déclarée, limitée aux questions réellement affichées.
- **/professionnels**
  - Nouveau bloc « La console des agences » : démonstration `/pro?demo=1` sans compte, et ouverture
    du compte agence.
  - Une seule promesse d'essai (un par agence, 2 min 30), alignée sur `/pro`.
  - `Organization`, `Service` B2B et `FAQPage` déclarés.
  - Lien ajouté dans le pied de page.
- **Confidentialité** : le fournisseur d'aide à la rédaction n'est plus nommé. Le texte indique une
  catégorie de destinataire et un nom communiqué sur demande. **À valider par le conseil juridique
  de la maison.**
- **Aucun prix, quota ni délai n'a été inventé.** L'audit relève une incohérence de modèle : le site
  promet « 60 % pour l'agence », alors que `/pro` fait payer l'agence avec des tarifs encore TBD.
  Règle de cohérence proposée : tarif agence = 40 % du prix famille. Décision à prendre par la
  maison.

## 4. Design Motion et 3D

- **Motion 14.12 (MIT)**, réduit à 11 Ko (`animate` en version mini, `inView`, `stagger`) :
  - des filets d'or qui se tracent et des entrées lentes sur l'accueil, /offres, /professionnels et
    /qui-sommes-nous ;
  - une entrée douce des vues de `/pro` (0,45 s).
  - Ce qui est déjà à l'écran n'est jamais caché.
- **three.js r187 (MIT)**, sous-ensemble chargé à la demande : une médaille de pierre sombre,
  cerclée d'un filet d'or, qu'une lumière chaude effleure. Elle apparaît sur l'accueil (avant
  l'appel final) et sur /professionnels.
  - Conditions de chargement : écran d'au moins 900 px, pointeur précis, au moins 4 cœurs, WebGL,
    pas d'économie de données.
  - Le rendu se met en pause hors écran et quand l'onglet est caché.
  - Repli CSS identique, fait de filets d'un pixel.
- **Mouvement réduit respecté partout** : `recueil.js`, `lumiere-3d.js` et `entree()` de `/pro`
  sortent immédiatement, et les transitions CSS sont neutralisées.
- Vérifié dans Chromium :

  | Contexte | 3D chargée | Résultat |
  |---|---|---|
  | Bureau | oui | rendue |
  | Mobile 390 px | non | médaille fixe affichée |
  | Mouvement réduit | non | contenu immobile et visible |

  Dans les trois cas, aucune erreur JavaScript.
- Charte respectée : or en traits uniquement. L'anneau extérieur, d'abord dessiné par une ombre de
  10 px qui formait un aplat, est passé en `outline` d'un pixel. Logo officiel inchangé.
- Service worker : régénéré par `build/sw-modele.js` (version `5b27e9d141`). three.js **n'est pas
  préchargé** : seuls les petits scripts le sont.

## 5. Visuels

- `VISUELS_A_GENERER.md` couvre :
  - 6 visuels du site public (A1-A6) ;
  - 13 visuels de `/pro` (B1-B13).
- Pour chacun : emplacement, format, ratio, et un prompt par outil (Gamma, Higgsfield, ChatGPT,
  Grok Imagine), plus les interdits (logo, portraits de défunts, fausses interfaces).
- Les placeholders v2 sont produits par `scripts/v2-visuels.mjs` et **ne sont branchés sur aucune
  page publique**.

## 6. Auto-revue hostile

| Point | Constat |
|---|---|
| Régression ESM | Gardée par `tests/api/chargement.test.mjs`, qui tourne dans `npm test`. |
| Auth des routes musique (corrigée en #27) | Inchangée : `garder()` est toujours appelée en tête ; tests de sécurité verts. |
| Secrets | Aucun dans le diff (recherche de motifs de clés, du code maître, de jetons). Le code maître reste lu dans `PRO_CODE_MAITRE`, côté serveur seulement. |
| Mention des fournisseurs côté client | Aucune ajoutée. Une retirée (confidentialité). **Fuite antérieure découverte et corrigée** : Vercel servait les `.md` de la racine (rapports nommant le fournisseur), `docs/`, `tests/`, `apps/`, les sources Rust et `lib/` (code serveur). Correctif : `.vercelignore` étendu, plus une redirection `/lib/*` → `/404`, car `lib/` doit rester téléversé pour les fonctions. Vérifié dans la sortie de `vercel build` et gardé par `tests/api/exposition.test.mjs`. |
| Accessibilité | Médaille en `role="img"` avec libellé ; toile, filets et numéros en `aria-hidden` ; étapes en liste ordonnée ; bouton-lien avec `:focus-visible`. |
| Mobile | Aucun téléchargement 3D ; 11 Ko de Motion sur 4 pages. |
| Migrations | Aucune appliquée ; aucune commande d'application dans le diff. |

## 7. Résultats des tests (état final, clone LF propre)

| Commande | Résultat |
|---|---|
| `npm test` (api + pro + julie) | **124 / 124** |
| `npm run check` | « Site complet, liens internes valides. » |
| Régénération (`node build/build.js`) | Idempotente : aucune différence sur les fichiers générés |
| `scripts/prouver-migrations.mjs` (PGlite) | **35 / 35** |
| `tests/e2e/pro.e2e.mjs` (Chromium) | **40 / 40**, aucune erreur JavaScript |
| `vercel build` + sonde | 34 / 34 fonctions chargées |

Rust : non modifié, à l'exception d'un commentaire de documentation dans `melodia-pro-wasm/src/lib.rs`.
Le `.wasm` n'a pas été reconstruit, et ce n'est pas nécessaire.

Sur ce poste, `npm run test:julie` (une boucle `for` de shell) ne s'exécute pas sous `cmd.exe`. Les
mêmes tests tournent dans `npm test`, en globs Node portables.

## 8. Ce qui doit exister en production (noms seulement, aucune valeur)

Réglages serveur que lit le code ; **à créer par la maison dans Vercel**, jamais dans le dépôt :

- Supabase : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Pro : `PRO_CODE_MAITRE` (code maître, saisie insensible à la casse et aux espaces),
  `PRO_CODE_MAITRE_EMAILS`, `PRO_EMPREINTE_SEL` (sel), `PRO_URL_SITE`
- Paiement agence : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (mode test tant que non validé)
- Composition : `MUREKA_API_KEY` (et facultatifs `MUREKA_API_URL`, `MUREKA_MODEL`). Paroles :
  `MISTRAL_API_KEY` / `MISTRAL_MODEL` ou `OPENAI_API_KEY`
- Courriel : `RESEND_API_KEY` ; tâches planifiées : `CRON_SECRET`
- Plafonds de dépense : réglages **en base** (`pro_settings.plafond_jour_cents`, coûts estimés),
  encore TBD, à saisir dans `/pro` → Admin

Côté public : `PAYPAL_CLIENT_ID` (identifiant public, dans `assets/js/config.js`) pour remplacer le
lien PayPal.me. Ce n'est pas un secret, mais c'est une décision de compte, donc non faite ici.

## 9. Risques restants

1. **Le correctif ESM n'est pas encore en production.** Après fusion et déploiement par la maison,
   vérifier `/api/music-config` (200) et `/api/pro/me` (401 sans jeton).
2. **Mentions légales incomplètes** (SIRET, adresse, médiateur) : obligation légale, à traiter
   avant toute campagne.
3. **Tarifs agence TBD** : `/pro` ne peut pas encaisser tant qu'ils ne sont pas saisis. Voir la
   règle des 40 % dans l'audit.
4. **Migration 11 non appliquée** : la console Julie reste sur son repli (journal et stockage local).
5. **Fuite de documents internes** : corrigée pour l'avenir, mais les déploiements antérieurs les
   servaient déjà. Des copies ont pu être indexées : vérifier dans la Search Console et demander leur
   retrait si besoin.
6. `/compte?retour=/pro` : le parcours d'ouverture de compte agence repose sur l'existant (PR #27).
   Il est couvert par l'E2E en mode démonstration, pas avec un vrai compte.
7. three.js pèse 135 Ko compressés, chargés seulement sur grand écran capable, après inactivité.
   Surveiller les Web Vitals après mise en ligne.
