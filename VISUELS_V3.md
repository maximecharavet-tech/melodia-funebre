# Visuels v3 — ce qui manque encore

12 novembre 2026. **Aucune image ni aucune vidéo n'a été générée pour la v3, et aucun service n'a été
appelé.** Ce document liste les visuels qui manquent encore. Les règles communes de
`VISUELS_A_GENERER.md` s'appliquent sans exception :

- logo jamais généré ;
- aucun texte dans l'image ;
- aucun visage ni portrait de famille ;
- or en lumière et en filets, jamais en aplat ;
- neutralité religieuse ;
- métadonnées d'outil retirées avant dépôt.

Aucun emplacement ci-dessous n'est branché sur une page : il n'y a donc **aucun placeholder visible
en ligne**. Chaque visuel s'ajoute en une ligne dans le générateur, le jour où il est livré.

## Déjà réemployés en v3 (rien à produire)

| Visuel existant | Nouvel usage |
|---|---|
| `assets/img/v2/console-portable.webp` | Bloc « La console des agences » de `/professionnels` (remplace la médaille 3D) |
| `assets/img/pro/onboarding-{1,2,3}-640.webp` | Bande « Recueillir · Composer · Transmettre » de `/professionnels` |
| `assets/img/v2/og-offres.jpg` | Fond du héros de `/offres`, grand écran seulement |
| `assets/img/v2/og-professionnels.jpg` | Fond du héros de `/professionnels`, grand écran seulement |

## À produire

### V3-1 · Héros `/offres`, version mobile

- **Emplacement prévu :** `assets/img/v3/offres-mobile.webp`. Fond du héros sous 1000 px, là où
  la version large n'est pas chargée.
- **Format :** WebP, 900 × 1125 px (fournir aussi le PNG source).
- **Ratio :** 4:5, portrait.
- **Composition :** le sujet occupe le tiers inférieur. Les deux tiers supérieurs restent presque
  noirs pour porter le titre.
- **Prompt :**
  > Vertical 4:5 still life photograph, very low key. A dark walnut music stand seen from below
  > in the lower third of the frame, an open notebook of blank staff paper resting on it, a slim
  > brass fountain pen across the pages. A single warm candle light from the right grazes the
  > paper edges and the brass. The upper two thirds of the frame fall into deep near-black shadow
  > (#040407). Muted ivory paper tones, patinated brass highlights, fine film grain, shallow depth
  > of field, quiet and dignified, funeral-home calm. No people, no hands, no text, no letters,
  > no logo, no religious symbol.

### V3-2 · Héros `/professionnels`, version mobile

- **Emplacement prévu :** `assets/img/v3/professionnels-mobile.webp`.
- **Format :** WebP, 900 × 1125 px, plus le PNG source.
- **Ratio :** 4:5.
- **Prompt :**
  > Vertical 4:5 interior photograph of a funeral home reception desk at dusk, very low key. In
  > the lower third: a closed dark leather folder and a switched-off tablet lying flat on a dark
  > oak counter, a small vase of dried white gypsophila slightly out of focus. Window light from
  > the left, warm and soft, rim-lighting the edges of the leather and the tablet. Upper two
  > thirds in deep shadow (#0b0b11). Calm, professional, discreet. The tablet screen is black and
  > off, showing no interface. No people, no text, no logo, no brand marks.

### V3-3 · « Comment circule l'argent » : illustration de bandeau (facultative)

- **Emplacement prévu :** au-dessus du tableau de répartition, `assets/img/v3/registre.webp`.
- **Format :** WebP, 1600 × 500 px.
- **Ratio :** 16:5, bandeau.
- **Prompt :**
  > Wide 16:5 still life, low key. An old leather-bound ledger lying open on a dark wooden desk,
  > pages blank and ivory, a brass paperweight and a slim pen beside it. A single warm lamp from
  > the top left draws a thin line of golden light along the page edges. Everything else falls
  > into deep near-black shadow. Sober, honest, archival mood. No numbers, no writing, no text,
  > no coins, no banknotes, no people, no logo.

### V3-4 · Couverture du kit agence, version web légère (redimensionnement, pas de génération)

- **Source existante :** `assets/img/v2/kit-agence-couverture.webp` (462 Ko, trop lourd pour une
  page).
- **À faire :** une déclinaison de 1200 px de large, inférieure à 120 Ko, avec `sharp` ou
  `cwebp -q 72`, puis l'ajouter en tête de la section « Les visuels sont déjà faits » de
  `/professionnels`. **Aucun prompt** : c'est le visuel officiel déjà livré.

### V3-5 · Aperçu social de l'accueil (facultatif)

- **Emplacement prévu :** `assets/img/v3/og-accueil.jpg`. Il remplacerait
  `assets/img/og-melodia.jpg` dans `build/p-index.js` (`image:`).
- **Format :** JPEG, 1200 × 630 px, moins de 150 Ko.
- **Ratio :** 1,91:1.
- **Composition :** vide à gauche (le titre est ajouté ensuite, en Cormorant Garamond). Le logo
  officiel est posé en post-production, jamais généré.
- **Prompt :**
  > Wide 1.91:1 photograph, very low key. On the right third, a single white lily lying on dark
  > polished granite beside a small brass candle holder with a lit candle; warm candle light
  > creates a fine golden rim on the petals and on the granite edge. The left two thirds are
  > deep, almost black (#040407), clean negative space. Quiet, tender, dignified, no religious
  > symbol. No people, no text, no letters, no logo.

## Dépôt

1. Exporter au format indiqué et retirer les métadonnées d'outil (`exiftool -all= fichier`).
2. Déposer au chemin prévu.
3. Brancher dans le générateur (`build/p-*.js`) ou dans la feuille (`assets/css/style.css`, bloc
   « v3 »).
4. Lancer `node build/build.js` dans un clone LF, puis `npm run check` et `npm test`.
