# Build — console-julie-wasm

Ce crate Rust compile en un fichier `.wasm` **autonome** (aucun `wasm-bindgen`,
aucune dépendance npm, aucun bundler). Les exports sont en ABI C (`#[no_mangle]
extern "C"`) et communiquent par des chaînes JSON passées via la mémoire linéaire.

## Prérequis (poste de dev uniquement — rien n'est requis en production)

- Rust stable ≥ 1.75 : <https://rustup.rs>
- Cible wasm : `rustup target add wasm32-unknown-unknown`

Cargo et Rust ne sont **pas** des dépendances du site : le `.wasm` compilé est
versionné dans `assets/js/vendor/julie_v2.wasm`, comme le seraient des polices
auto-hébergées. Le brief interdit les dépendances npm d'exécution ; un crate
Rust compilé dans un fichier `.wasm` respecte cette règle.

## Compilation

```sh
cd console-julie-wasm
cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/julie_v2.wasm ../assets/js/vendor/julie_v2.wasm
```

Taille attendue : ~140–180 Ko brut, ~50–70 Ko gzip. C'est **un seul fichier**
chargé une fois, en `requestIdleCallback`, sans bloquer le premier rendu.

## Contrat ABI (protocole chaîne JSON)

| Export | Entrée (JSON) | Sortie (JSON) |
|---|---|---|
| `alloc(len) -> *mut u8` | — | pointeur mémoire |
| `dealloc(ptr, len)` | — | — |
| `score_prospect` | `{type, etablissements, effectif, email, site, dirigeant, departement, oppose, rejete, dernier_contact_le, evenements[], departements_prioritaires[], maintenant_iso}` | `{score, contributions[], couleur, motif_zero}` |
| `delivrabilite_verifier` | `{objet, preheader, texte, html, liens[], piece_jointe_ko, variables_non_resolues[], personnalise, a_desabonnement}` | `{score, note, problemes[], ok[]}` |
| `csv_parser` | `{texte}` | `{entetes[], lignes[][], separateur}` |
| `csv_detecter_colonnes` | `["Col A", "Col B", …]` | `{mapping{}, colonnes_reconnues[], colonnes_inconnues[]}` |
| `similarite` | `{a, b}` | `{score, methode}` |
| `dedupe_cle` | `{siret, email, nom, cp}` | `{siret, email, nom_cp}` |
| `domaine_suggere` | `{domaine}` | `{suggestion: "gmail.com" \| null}` |
| `meilleur_creneau` | `{cases[{jour_semaine, heure, ouverts, envois}], maintenant, fuseau}` | `{iso, jour_semaine, heure, minute, confiance, motif}` |
| `sequence_prochaine_etape` | `{debut_iso, etapes[{jour, modele, canal}], etapes_faites, statut, oppose, rejete, a_repondu, clics_recents}` | `{terminee, index, date_iso, modele, canal, cle_idempotence, motif, motif_sortie}` |
| `jours_feries_annee` | `{annee}` | `["2026-01-01", "2026-04-06", …]` |

Le pointeur retourné par chaque export pointe sur `[u32 little-endian : longueur]
+ [bytes UTF-8 du JSON]`. Le JS doit appeler `dealloc(ptr, 4 + len)` après
lecture, comme le fait `assets/js/vendor/julie-wasm-glue.js`.

## Intégrité du binaire

Le binaire est vendu « tel quel ». Pour le régénérer sur une autre machine, la
procédure est identique ; aucun état n'est stocké dans le `.wasm`. Le `Cargo.lock`
doit être commité dans `console-julie-wasm/` pour garantir la reproductibilité.
