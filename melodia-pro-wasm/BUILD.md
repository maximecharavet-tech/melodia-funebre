# Build — melodia-pro-wasm

Noyau Rust de la console Melodia Funèbre Pro, compilé en un fichier `.wasm`
autonome (ABI C + JSON, aucun `wasm-bindgen`, aucun bundler). Le **même**
fichier est chargé :

- dans le navigateur par `assets/js/vendor/melodia-pro-glue.js` ;
- dans les fonctions Vercel par `lib/pro/noyau.mjs`.

Une règle (prix, transition d'état, éligibilité à l'essai, nettoyage du
prompt, contraste d'un QR) n'existe donc qu'une fois.

## Prérequis (poste de dev seulement)

- Rust stable ≥ 1.75 et `rustup target add wasm32-unknown-unknown`
- facultatif : `wasm-opt` (binaryen) — 201 Ko brut → 167 Ko optimisé

Sans Rust installé, le conteneur officiel suffit (c'est ainsi que le fichier
versionné a été produit, le 11/11/2026) :

```sh
docker run --rm -v "$PWD/melodia-pro-wasm:/src" -v "$PWD/assets/js/vendor:/v" \
  -w /src rust:1-bookworm bash -c '
    rustup target add wasm32-unknown-unknown &&
    cargo test &&
    cargo build --target wasm32-unknown-unknown --release &&
    apt-get update -qq && apt-get install -y -qq binaryen &&
    wasm-opt -Oz --enable-bulk-memory --enable-sign-ext \
      --enable-nontrapping-float-to-int --enable-mutable-globals \
      target/wasm32-unknown-unknown/release/melodia_pro.wasm -o /v/melodia_pro.wasm'
```

Sinon : `npm run build:wasm` (qui reconstruit aussi la console Julie).

## Pourquoi pas de tables Unicode ni de `derive(Deserialize)`

Le budget est de 200 Ko. `char::is_alphanumeric` et `to_uppercase` embarquent
des tables Unicode complètes ; les désérialiseurs dérivés coûtent 3 à 6 Ko par
structure. Le crate lit donc tout depuis `serde_json::Value` et teste les
lettres latines avec `texte::alnum`. Gain mesuré : 225 Ko → 167 Ko.

## Contrat ABI

Chaque export prend `(ptr, len)` d'une chaîne JSON, rend un pointeur sur
`[u32 LE longueur][octets JSON]`, à libérer par `dealloc(ptr, 4 + longueur)`.

| Export | Entrée | Sortie |
|---|---|---|
| `pro_version` | `{}` | `{version}` |
| `qr_svg` | `{texte, modules: carre\|arrondi\|point, yeux: carre\|arrondi, encre, fond, oeil, logo (0–0,2), logo_href, marge, taille_mm, titre, formes}` | `{ok, svg, modules, version, cote, echelle, module_um, contraste_x100, logo_zone, alertes[], formes?}` ou `{ok:false, erreur}` |
| `prix_calculer` | `{prix_unitaire_cents, quantite, remise:{type, valeur}, tva_bp, mention_franchise, code_maitre}` | `{ok, sous_total_cents, remise_cents, ht_cents, tva_cents, ttc_cents, gratuit, mention_tva}` |
| `promo_normaliser` | `{code}` | `{stripe, strict, format_valide}` |
| `questionnaire_valider` | questionnaire | `{complet, pourcentage, etapes[], nb_manquants, nb_erreurs}` |
| `questionnaire_nettoyer` | `{texte}` ou `{valeur}` | `{propre, retraits[]}` |
| `prompt_construire` | `{questionnaire, essai, duree_s, proposition, paroles}` | `{consigne_paroles, prompt_musique, paroles_chant, retraits[], segments_retires, alertes[]}` |
| `prompt_assainir` | `{texte, artistes[]}` | `{texte, segments_retires}` |
| `statut_transition` | `{de, vers, acteur}` | `{ok, erreur?}` |
| `statut_suivants` | `{de, acteur}` | `{suivants[], etats[]}` |
| `essai_eligibilite` | `{compte_valide, siret, email, empreintes{}, empreintes_connues[], essais_org_utilises, essais_par_org, essais_jour, plafond_jour, duree_s, mode}` | `{eligible, motifs[], duree_s, mode, revue_maison}` |
| `siret_valider` | `{siret}` | `{valide, canonique}` |
| `jeton_valider` | `{jeton}` | `{valide}` |

## Tests

`cargo test` : 57 tests — chaque style de QR (3 formes de modules × 2 formes
d'yeux, avec et sans logo, deux versions, deux résolutions) est rastérisé puis
relu par `rqrr` ; contraste, prix en centimes, transitions légales et
illégales, éligibilité à l'essai, SIRET, nettoyage du prompt.

Licences des dépendances : voir `THIRD_PARTY.md` à la racine.
