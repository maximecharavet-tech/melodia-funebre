# CREDITS — Console Julie v2

Aucun code de projet tiers n’est copié dans la console. Les implémentations
sont originales, dans la même langue (HTML/CSS/JS standard, Rust compilé en
WebAssembly) et sans framework. Ce fichier recense les projets **étudiés**
pour en reprendre *les idées* et, le cas échéant, les **algorithmes publics**
intégrés (compatibles MIT ou Apache-2.0, crédités ci-dessous).

## Code effectivement porté (algorithmes)

| Source | Licence | Ce qui a été porté |
|---|---|---|
| **Howard Hinnant**, *chrono-Compatible Low-Level Date Algorithms* | Domaine public | Conversion date ↔ jours depuis epoch (dans `console-julie-wasm/src/date.rs`, `jours_depuis_epoch` / `depuis_jours`). |
| **Jean Meeus / Butcher**, calcul de la date de Pâques (algorithme grégorien) | Algorithme public, aucune licence de code | `paques()` dans `console-julie-wasm/src/date.rs` — formule classique de comput ecclésiastique. |
| **kylehill/mailcheck** — `src/mailcheck.js` | MIT | Suggestion de domaine par distance de Levenshtein, portée en Rust dans `console-julie-wasm/src/dedupe.rs` (`levenshtein`, `domaine_json`). Le code d’origine n’a pas été copié, seul l’algorithme (n-grammes + liste de domaines) a été réécrit. |
| **Matthew A. Jaro (1989), William E. Winkler (1990)** — Jaro-Winkler | Algorithme public, publié | `jaro` / `jaro_winkler` dans `console-julie-wasm/src/dedupe.rs`. Aucun code source copié : la spécification mathématique est reproduite. |

## Projets étudiés (idées uniquement, zéro code copié)

| Projet | Licence | Inspiration |
|---|---|---|
| `pacocoursey/cmdk` | MIT | Modèle clavier et score de la palette (futur PASS 3). Aucun code copié en PASS 1. |
| `resend/react-email` | MIT | Structure des courriels (bouton MSO, preheader, dark-mode). Le `gabarit()` existant a servi de base ; les ajouts PASS 2 s’en inspireront. |
| `shadcn-ui/ui` (`dashboard-01`) | MIT | Disposition des cartes KPI et de la data-table (PASS 2). |
| `tremorlabs/tremor` | Apache-2.0 | Micro-graphiques (Tracker, BarList, ProgressCircle) — ré-implémentés en SVG pur (PASS 2). |
| `motiondivision/motion` | MIT | `animate/stagger/spring/inView` si vendorisé (PASS 2, optionnel, sous 25 Ko gzip). |
| `krayin/laravel-crm` (`packages/Webkul/Lead`) | MIT | Étapes de pipeline + probabilités (réutilisées dans `julie-pipeline.js`). |
| `dittofeed/dittofeed` (`journeys`) | MIT | Modèle de séquence avec attentes, critères de sortie, idempotence — réimplémenté dans `console-julie-wasm/src/sequences.rs`. |
| `umami-software/umami` (`realtime`) | MIT | Flux temps réel (PASS 3). |
| `YunaiV/ruoyi-vue-pro` (`yudao-module-crm`) · `yudaocode/yudao-ui-admin-vue3` (`crm/backlog`) | MIT | Backlog du jour, pool de réserve (公海), garde anti-doublon. L’idée du `prospect-doublon.js` vient de là. Aucun code copié. |
| `vbenjs/vue-vben-admin` (`dashboard/workspace`) | MIT | Disposition de « Ma journée » (salutation + todo + actions rapides). |
| `pure-admin/vue-pure-admin`, `HalseySpicy/Geeker-Admin` | MIT | Densité des tableaux, barres d’action en masse (PASS 2). |
| `SortableJS/Sortable` | MIT | Idée de drag & drop (implémentée en Pointer Events natif, sans vendoriser la lib). |
| `krisk/Fuse` | Apache-2.0 | Idée de score flou (réimplémentée en Rust, sans vendoriser la lib). |
| `leeoniya/uPlot` | MIT | Non utilisé en PASS 1. Réservé si le SVG maison ne suffit pas. |

## Projets expressément NON utilisés (licence incompatible avec le brief)

Les projets suivants sont cités dans le brief comme **idées uniquement**, aucun
code n’en est copié ni adapté :

- `twentyhq/twenty` (AGPL-3.0)
- `knadh/listmonk` (AGPL-3.0)
- `mautic/mautic` (GPL-3.0)
- `frappe/crm` (GPL-3.0)
- `plausible/analytics` (AGPL-3.0)
- `calcom/cal.com` (AGPL-3.0) — seule l’idée d’un état vide d’onboarding a été retenue

## Binaire WebAssembly

`assets/js/vendor/julie_v2.wasm` est compilé depuis
`console-julie-wasm/` (voir `console-julie-wasm/BUILD.md`). Il contient
uniquement du code Rust original, publié sous la même licence interne que la
console. Aucune dépendance transitive (crate) n’est embarquée dans le binaire
au-delà de `serde` / `serde_json` (MIT / Apache-2.0, voir `Cargo.lock`).

## Repli JavaScript

`assets/js/vendor/julie-fallback.js` reprend en JavaScript pur, de façon simplifiée,
les mêmes calculs que le wasm. Il n’est utilisé que si `julie_v2.wasm` ne se charge pas.
