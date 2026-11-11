# Console Julie v2 — état d’intégration (PR brouillon)

**Branché :** Ma journée (vue par défaut), Pipeline (glisser-déposer), Composer
(accroche `{accroche}` + IA gratuite, dispositions lettre/carte/éditoriale,
aperçu serveur, note de délivrabilité A–F), Séquences (stockage local tant que
la migration 09 n’est pas appliquée), Suivi des envois (journal
`/api/prospect-mail`), Import CSV 2.0. Les vues s’inscrivent dans le routeur
de `commercial.js` (`window.MelodiaConsole.ajouterVue`) : toutes les vues
existantes restent identiques (Mail prêt, quotas, STOP, 9 brochures, suivi
d’ouverture, CSV, modèles).

**Envoi :** toujours par « Mail prêt à envoyer » ou par le triage des relances,
via `/api/prospect-mail` (quota, dédoublonnage, mention STOP). L’envoi
automatique quotidien (`api/sequences-cron.js`) est **inactif** : aucun cron
n’est déclaré dans `vercel.json` et la fonction ne fait rien sans
`SEQUENCES_AUTO=true`.

**Noyau Rust → wasm :** `npm run build:wasm` (rustup, cible
`wasm32-unknown-unknown`). Le binaire est versionné ; si le wasm ne se charge
pas, `assets/js/vendor/julie-fallback.js` prend le relais.

**Migration :** `supabase/migrations/20261111_09_console_v2.sql`, **non appliquée**.

---

# Console Julie v2 — « Votre console en 2 minutes »

Bonjour Julie. Voici ce qui change dans votre console commerciale et comment
l’utiliser au quotidien.

## Ce qui est nouveau

Trois entrées apparaissent **en haut de votre sidebar**, dans un groupe
« Ma journée » :

- **Ma journée** (par défaut, touches `G J`)
- **Mon pipeline** (`G P`)
- **Mes séquences** (`G S`)

Vos vues habituelles restent accessibles, à l’identique, juste en dessous.
Elles ne changent pas.

## Ma journée

C’est votre nouvel écran d’accueil. Il s’ouvre à chaque connexion. De haut en
bas :

1. **Bonjour Julie** — la date, une phrase calme, votre anneau d’objectif
   (mails, appels, relances) et le quota d’envoi du jour.
2. **À traiter maintenant** — les réponses marquées et les prospects qui ont
   ouvert plusieurs fois ou cliqué dans les dernières 48 h. Boutons : Appeler,
   Intéressé, Rappeler, Pas maintenant, STOP.
3. **Relances prêtes** — les étapes de séquence dues aujourd’hui. Cliquez sur
   « Relire et envoyer les N relances » : vous passez en revue les unes après
   les autres. `←` / `→` pour naviguer, `E` pour envoyer, `S` pour passer,
   `✎` pour éditer. Rien ne part sans votre clic.
4. **Nouveaux à contacter** — les meilleurs scores jamais contactés, triés.
   « Composer » pour en prendre un.
5. **À enrichir** — les fiches qui manquent d’un courriel, d’un site ou d’un
   dirigeant. « Compléter » pour ouvrir la fiche.
6. **Plus tard** — ce qui est prévu cette semaine.

## Mon pipeline

Sept colonnes, une par statut, avec le potentiel pondéré en euros par colonne.
Vous pouvez faire glisser une carte d’une colonne à l’autre. Au clavier :
focus sur une carte, puis `M` pour ouvrir « Déplacer vers… ».

Un déplacement vers **Intéressé**, **Démo offerte**, **Partenaire** ou
**Sans suite** sort automatiquement le prospect de sa séquence.

Filtres en haut : type (pompes funèbres / crématoriums / marbriers / cultes)
et département.

## Mes séquences

Une séquence « Premier contact » existe par défaut : J0 (premier message),
J+3 (relance), J+7 (dernière relance). Vous pouvez la cloner, changer les
délais, les modèles, la cible, et y inscrire jusqu’à dix prospects d’un coup.

**Les étapes ne partent jamais toutes seules.** Les envois automatiques
existent (route `/api/sequences-cron`), mais ils sont **désactivés par défaut**
(`SEQUENCES_AUTO` absent = désactivé). Un humain valide toujours. Le cron ne
fait qu’avancer les dates et journaliser les tâches.

## Import CSV 2.0

Dans « Mes prospects », le bouton d’import propose désormais :

- détection automatique du séparateur (`;`, `,`, tabulation) et des colonnes
  (nom, courriel, SIRET, code postal…) ;
- prévisualisation des cinq premières lignes ;
- rapport de dédoublonnage : nouveaux / doublons / conflits / invalides ;
- enrichissement SIRENE pour les lignes sans SIRET ;
- inscription facultative des nouveaux dans une séquence.

## Vérificateur de délivrabilité

Chaque courriel composé affiche maintenant une note **A à F** avec la liste
précise des problèmes détectés : mots à risque, longueur du sujet, nombre de
liens, variables non résolues, présence du désabonnement. Les adresses sont
aussi vérifiées (syntaxe, MX, déjà contactée).

## Votre signature et votre quota

Le quota d’envoi reste **30 courriels par jour** (compté sur le jour de Paris).
Le fondateur a 100. Les tests comptent séparément (10 par jour). Sans clé
d’envoi configurée côté serveur, la console retombe sur le lien `mailto:` —
rien n’est perdu en silence.

## Ce qu’il faut vérifier avant d’utiliser en production

1. **Le fichier WebAssembly doit être compilé et versionné** :
   `assets/js/vendor/julie_v2.wasm` doit exister. Sinon `npm run check` échoue.
   Voir `console-julie-wasm/BUILD.md` pour la procédure (une seule commande
   `cargo build --release --target wasm32-unknown-unknown`).

2. **La migration 09 n’est pas appliquée.** Tant qu’elle ne l’est pas, la
   console utilise `prospects.journal` et `localStorage` pour les séquences et
   les objectifs. Un avis discret s’affiche une fois par session : « Suivi
   avancé : migration 09 à appliquer ». Rien ne casse.

3. **La variable `{accroche}`** dans le modèle `pf-premier-contact` doit être
   substituée côté serveur. Un petit ajout à `remplir()` dans
   `api/_prospect-outils.js` et `lib/prospect-outils.cjs` est nécessaire pour
   qu’une accroche vide disparaisse proprement (pas de double ligne vide).
   Tant que cet ajout n’est pas fait, la variable reste telle quelle dans
   l’aperçu et le contrôleur de délivrabilité la signalera comme
   « non résolue ». Voir la description de la PR.

4. **Le cron `vercel.json` est proposé, non appliqué.** Le bloc `crons` de
   `vercel.json` prévoit un déclenchement à `07:40 UTC` (08:40 Paris en
   hiver, 09:40 Paris en été). Aucun envoi ne se produit tant que
   `SEQUENCES_AUTO !== 'true'`.

## Raccourcis

| Touche | Action |
|---|---|
| `G` puis `J` | Ma journée |
| `G` puis `P` | Mon pipeline |
| `G` puis `S` | Mes séquences |
| `←` / `→` | Naviguer dans le triage |
| `E` | Envoyer (triage) |
| `S` | Passer (triage) |
| `M` | « Déplacer vers… » (carte focus) |
| `Échap` | Fermer le triage |

## Support

En cas de doute, la console reste utilisable sans les nouveautés. Les vues
historiques et les envois manuels (`mailto:`) fonctionnent comme avant.
