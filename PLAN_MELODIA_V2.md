# Plan — Melodia Funèbre v2

Branche `claude/melodia-v2-succes-20261112`, partie de `main` (`d21604e`, PR #27 incluse).
Une seule PR vers `main`. Ni fusion, ni déploiement, ni migration appliquée, ni service payant.

L'ordre est imposé : rien après l'étape 1 tant que l'étape 1 n'est pas prouvée.

---

## 1. Correctif ESM (priorité absolue)

### Diagnostic

- `package.json` n'a pas de `"type": "module"`. Vercel (`@vercel/node`) compile donc chaque
  fonction `api/**/*.js` écrite en syntaxe `import`/`export` vers **CommonJS** : chaque
  `import` devient un `require()`.
- Depuis la PR #27, 21 fonctions importent `lib/pro/*.mjs` (ESM natif) :
  les 17 enveloppes `api/pro/*.js` et quatre routes historiques
  (`generate-lyrics`, `generate-music`, `music-status`, `music-config`).
  `require()` d'un `.mjs` lève `ERR_REQUIRE_ESM` → toutes ces fonctions tombent au
  chargement, y compris l'atelier musical du site public.
- Second défaut, indépendant : `api/pro/export.js` contient `import export from …` ;
  `export` est un mot réservé, le fichier ne se charge sous aucun format.
- Les 18 autres fonctions (console Julie, tunnel famille) n'importent que `api/_*.js`
  et tournent depuis des mois dans ce mode « syntaxe ESM compilée en CommonJS ».

### Choix : `lib/pro` passe en CommonJS (`.cjs`)

C'est le mode déjà éprouvé en production par les 18 fonctions saines. Il ne dépend
ni de `require(esm)` (variable selon la version de Node), ni de la détection de syntaxe,
ni d'un `"type": "module"` racine qui casserait `build/*.js`, `scripts/*.js` et la colle
UMD `assets/js/vendor/melodia-pro-glue.js`.

- `lib/pro/*.mjs` et `lib/pro/routes/*.mjs` → `.cjs` (`git mv`, historique conservé),
  `require` / `module.exports`. Les routes exportent la fonction en `module.exports`
  et leurs constantes nommées en `module.exports.X` (lisibles par `import` ESM).
- `noyau` : `import.meta.url` → `path.join(__dirname, …)`.
- `admin` : le `import()` dynamique de `api/_courrier.js` est conservé (valide en CommonJS).
- `api/**/*.js` : chemins `.mjs` → `.cjs` ; `export.js` corrigé (`exporter`).
- Tests `tests/pro/*` : chemins mis à jour.
- `scripts/check.js` : liste de fichiers mise à jour.

### Preuves

- `tests/api/chargement.test.mjs` (nouveau, dans `npm test`) :
  1. **graphe statique** : depuis chaque fonction `api/**/*.js`, suit tous les imports
     relatifs ; échoue si un `.mjs` est atteint ou si un fichier hors `api/` utilise la
     syntaxe ESM (Vercel ne le compilerait pas) ;
  2. **chargement réel en mode Vercel** : chaque fonction est convertie en CommonJS
     (même transformation que Vercel : `import` → `require`) dans un dossier temporaire
     puis chargée par `node --no-experimental-require-module` ; échec sur
     `ERR_REQUIRE_ESM`, `MODULE_NOT_FOUND` ou `SyntaxError` ; le gestionnaire exporté
     doit être une fonction.
  3. contre-épreuve : le test est d'abord lancé sur `main` pour montrer qu'il attrape
     bien la panne.
- `vercel build` local si l'outil s'exécute hors ligne (aucun `deploy`, aucun lien
  de projet distant) ; puis chargement de chaque `.func` produite avec la même option Node.

### Migration 09

- `20261111_09_console_v2.sql` a échoué en prod (`public.est_master()` inexistant) et a été
  annulée. Le fichier n'est **pas** réécrit.
- Nouveau fichier `20261113_11_console_v2_correctif.sql` : même contenu fonctionnel,
  idempotent, appuyé sur `app.est_master()` / `app.est_maison()`.
- Preuve locale seulement (`npm run test:sql` si Postgres local disponible, sinon
  vérification statique dans le test des migrations). Jamais `supabase db push`.

---

## 2. Audit commercial puis gains rapides

`AUDIT_COMMERCIAL_MELODIA.md` : site public, offres et tunnel PayPal, console Julie,
app `/pro`. Changements concrets, priorisés (impact × risque × effort).

Implémentés seulement s'ils sont à fort impact et faible risque :
- clarté de l'offre (149 / 299 / 499 €, déjà publics), ancrage, rassurance au moment du paiement ;
- appels à l'action cohérents, preuves (écoutes réelles, processus, délais déjà publiés) ;
- SEO on-page (titres, descriptions, données structurées, maillage interne) via `build/` ;
- page B2B : argumentaire, marge agence 60 %, accès à l'essai `/pro` ;
- aucun prix, quota ou délai inventé : TBD visibles côté admin.

## 3. Design premium, Motion, 3D sobre

- `motion` (MIT) vendu dans `assets/js/vendor/`, licence dans `THIRD_PARTY.md` ;
  apparitions lentes, désactivées sous `prefers-reduced-motion`.
- `three` (MIT) chargé à la demande, uniquement grand écran + GPU correct + pas de
  réduction de mouvement : un seul geste (lumière qui passe sur un volume sombre,
  filet d'or). Repli : image/fond statique.
- Charte : fonds `#040407 / #0b0b11 / #101018`, or en filets seulement, ivoire,
  Cormorant Garamond / Jost / JetBrains Mono, logo officiel uniquement.
- Le service worker suit via `build/sw-modele.js`.

## 4. Visuels

Placeholders aux bonnes proportions ; `VISUELS_A_GENERER.md` avec emplacement, format,
ratio, et un prompt par outil (Gamma, Higgsfield, ChatGPT, Grok Imagine). Aucun appel.

## 5. Qualité et livraison

- `npm run check`, `test:julie`, `test:pro`, test de chargement API, `test:sql` si possible.
- Auto-revue hostile (ESM, auth des routes musique, secrets, marque blanche, a11y,
  mouvement réduit, mobile, migrations non appliquées).
- Commits : hotfix ESM → migration 11 → audit + commercial → design → docs.
- Push + une PR (API GitHub si `gh` absent) ; `CLAUDE_REPORT_MELODIA_V2.md`.
