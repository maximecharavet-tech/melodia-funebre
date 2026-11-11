# Melodia Funèbre Pro — architecture

La console des agences partenaires, à l'adresse `/pro`. L'agence ouvre un
dossier, remplit le questionnaire (seule ou avec la famille), règle la
composition ou demande l'essai offert, relit les paroles et la description
musicale, puis reçoit la chanson, son QR code et sa page mémorial.

## Carte des fichiers

| Couche | Fichiers |
|---|---|
| Coquille et vues | `pro.html`, `assets/css/pro.css`, `assets/js/pro/app.js` (routeur), `assets/js/pro/vues/*.js` (chargées à la demande) |
| Données navigateur | `assets/js/pro/donnees.js` (adaptateur API + démonstration locale), `memoire.js` (IndexedDB), `i18n.js` + `assets/i18n/pro.fr.json` |
| Impressions | `assets/js/pro/gabarits.js` (12 supports), `pdf.js` (écrivain PDF maison), `pack.js` (pack promotionnel co-brandé) |
| Noyau Rust | `melodia-pro-wasm/` → `assets/js/vendor/melodia_pro.wasm` (167 Ko), colle `assets/js/vendor/melodia-pro-glue.js` (navigateur **et** Node) |
| Serveur | `api/pro/*.js` (enveloppes), `lib/pro/socle.mjs` (CORS, JWT, rôles, limites, audit, transitions), `lib/pro/routes/*.mjs`, `lib/pro/moteur.mjs` (file de travaux), `lib/pro/fournisseurs.mjs` (serveur seulement), `lib/pro/paiement.mjs`, `lib/pro/audio.mjs` |
| Routes historiques sécurisées | `api/generate-lyrics.js`, `api/generate-music.js`, `api/music-status.js` (garde `lib/pro/garde.mjs`), `api/music-config.js` (marque blanche) |
| Base | `supabase/migrations/20261112_10_pro_app.sql` (non appliquée) |
| Mémorial public | `hommage.html` + `assets/js/hommage.js` (repli sur `/api/pro/memorial`, code d'accès, partage, compteur) |
| Applications | `apps/android/` (Capacitor), `apps/desktop/` (Tauri 2) — voir `PLATEFORMES.md` |
| Tests | `melodia-pro-wasm` (`cargo test`), `tests/pro/*.test.mjs` (`npm run test:pro`), `scripts/prouver-migrations.mjs` (`npm run test:sql`), `tests/e2e/pro.e2e.mjs` (`npm run test:e2e`) |

## Variables d'environnement (à poser par Maxime, jamais dans le code)

| Variable | Rôle | Sans elle |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | écritures serveur, stockage privé | `/api/pro/*` répond 503 « pas encore configuré » |
| `SUPABASE_ANON_KEY` | vérification des jetons | idem |
| `STRIPE_SECRET_KEY` (`sk_test_…`) | Checkout, codes promo, portail | « Le paiement en ligne n'est pas encore configuré » |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | signature du webhook | le webhook refuse tout |
| `PRO_CODE_MAITRE` | valeur du code maître (décision n° 7) | aucun code maître |
| `PRO_CODE_MAITRE_EMAILS` (facultatif) | adresses autorisées en plus des comptes `master` | — |
| `PRO_EMPREINTE_SEL` | sel des empreintes anti-abus de l'essai | empreintes non salées (déconseillé) |
| `MISTRAL_API_KEY` / `OPENAI_API_KEY` | agent parolier | le travail « paroles » reste bloqué, la maison est alertée |
| `MUREKA_API_KEY` | composition | le travail « musique » reste bloqué |
| `CRON_SECRET` (facultatif) | autoriser un futur cron à appeler `job-tick` | sondage par la console seulement |
| `PRO_URL_SITE` (facultatif) | adresse de retour après paiement | domaine de production |

## Machine à états

`brouillon → complet → en_attente_paiement → paye | essai_accorde → paroles_en_cours → paroles_a_valider → musique_en_cours → controle_maison → livre (→ revision_demandee)`, plus `echec`, `annule`, `rembourse`. Règles dans `melodia-pro-wasm/src/statut.rs`, appliquées par `transition()` (garde optimiste) côté serveur. Seul le service (webhook Stripe, code maître à 0 €, essai) fait passer un dossier à `paye` ou `essai_accorde` ; seule la maison livre.

## Pourquoi pas de cron

`vercel.json` ne déclarait aucun cron et le plan Vercel n'est pas connu. La file avance donc par `POST /api/pro/job-tick`, appelé par la fiche dossier toutes les 15 secondes tant qu'un travail est en cours (et par l'Admin maison). Un cron pourra s'ajouter plus tard : la route accepte `Authorization: Bearer $CRON_SECRET`.

## Mode démonstration

`/pro?demo=1` : tout reste dans le navigateur (IndexedDB), le pipeline est simulé pas à pas, rien n'est envoyé ni facturé, la page le dit en permanence. C'est le mode des essais de bout en bout.
