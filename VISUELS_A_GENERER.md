# Visuels à générer — Melodia Funèbre

12 novembre 2026. **Aucun service n'a été appelé pour produire ce document** : ni Gamma, ni
Higgsfield, ni ChatGPT, ni Grok Imagine, ni aucun autre. Les visuels ci-dessous seront produits
séparément (Grok Bot), puis déposés dans le dépôt selon la procédure en fin de document.

Chaque visuel a déjà un **placeholder** au bon nom et aux bonnes proportions (fond `#040407`,
filet or d'un trait, logo officiel tel quel, mention « Visuel provisoire »). Les placeholders du
site public (`assets/img/v2/`, `assets/video/v2/`) **ne sont branchés sur aucune page** : une
famille ne doit jamais voir « provisoire ». Ceux de `/pro` (PR #27) sont branchés dans la console.

---

## Règles communes (à recopier en tête de chaque session de génération)

1. **Le logo n'est jamais généré ni redessiné.** Aucune image ne doit contenir de logo, de
   monogramme « MF », de colombe dorée ou de clé de sol stylisée. Le fichier officiel
   (`assets/img/logo-melodia-600.webp`, `logo-melodia-complet.jpg`) est posé en post-production.
2. **Aucun texte dans l'image** (les générateurs l'écrivent mal) : titres et mentions sont ajoutés
   ensuite, en Cormorant Garamond / Jost / JetBrains Mono.
3. **Aucun visage de défunt, aucun portrait inventé** présenté comme réel, aucun cercueil ouvert,
   aucune larme en gros plan. Mains, objets, lumière, lieux : oui. Personnes : de dos, floues ou
   hors champ.
4. **Palette** : fonds `#040407` / `#0b0b11` / `#101018`, ivoire `#f2efe8`, or `#97803c` /
   `#c9a84c` / `#e3c977` **en lumière, reflets et filets fins uniquement — jamais en aplat**.
5. **Ton** : recueillement, pénombre chaude, lumière de bougie ou de fin de jour, matières nobles
   (pierre, bois sombre, papier vergé, laiton patiné). Jamais « tech », jamais néon, jamais
   particules, jamais d'effet « IA magique ».
6. **Neutralité religieuse** par défaut (pas de croix, d'étoile, de croissant) sauf visuel
   explicitement dédié à un rite.
7. **Marque blanche** : aucun nom d'outil ou de fournisseur dans les fichiers, leurs métadonnées
   ou leurs noms. Retirer les métadonnées EXIF/C2PA qui citent l'outil avant dépôt.
8. Livrer en **PNG** (images) ou **MP4 H.264** (vidéos), à la taille indiquée ou plus.

Prompt négatif commun (outils qui l'acceptent) :
`text, letters, watermark, logo, monogram, signature, faces in focus, coffin, crying, neon, particles, sparkles, lens flare, cyberpunk, futuristic UI, flat gold fill, gold background, cartoon, 3D render look, oversaturated`

---

## A. Site public (v2)

### A1 — Image de partage de la page Offres

| | |
|---|---|
| Emplacement final | `assets/img/v2/og-offres.jpg` (placeholder en place) ; à brancher ensuite sur `/offres` (champ `og:image` de `build/p-offres.js`) |
| Format | JPEG, 1200 × 630, < 300 Ko |
| Ratio | 1,91 : 1 — garder le tiers gauche calme pour le titre ajouté en post-production |

- **Gamma** : `Carte de partage sobre, 1200×630, fond presque noir #040407. À droite, sur un pupitre de bois sombre, une partition manuscrite vierge et une plume de laiton patiné, éclairées de côté par une bougie hors champ. Tiers gauche vide et sombre. Un filet doré très fin souligne le bord du pupitre. Aucun texte, aucun logo. Ambiance de recueillement, palette ivoire et or atténué.`
- **Higgsfield** (image) : `cinematic still, 1200x630, dark chapel-like room, right third: dark wooden lectern with a blank handwritten-style music sheet and a patinated brass pen, warm side light from an off-screen candle, deep shadows, left two thirds empty near-black (#040407), thin gold rim light on wood edge, shallow depth of field, 50mm, muted ivory and antique gold tones, no text, no logo`
- **ChatGPT** (image) : `Crée une image horizontale 1200×630 pour illustrer une offre d'hommage musical funéraire. Fond très sombre (#040407). Sur la droite : un pupitre en bois foncé avec une partition vierge et un stylo en laiton patiné, éclairés par la lueur chaude d'une bougie invisible. Laisse le tiers gauche entièrement sombre et vide pour un titre. L'or n'apparaît qu'en reflets fins, jamais en aplat. Pas de texte, pas de logo, pas de visage.`
- **Grok Imagine** : `Horizontal 1200x630 photo, near-black background, right side a dark wooden music stand holding a blank music sheet and an old brass pen, lit by a warm unseen candle, left side empty darkness for a headline, thin antique-gold highlights only, solemn and calm, photorealistic, no text, no logo, no people`

### A2 — Image de partage de la page Professionnels

| | |
|---|---|
| Emplacement final | `assets/img/v2/og-professionnels.jpg` (placeholder en place) ; à brancher sur `/professionnels` (`build/p-agences.js`) |
| Format | JPEG, 1200 × 630 |
| Ratio | 1,91 : 1 — tiers gauche libre |

- **Gamma** : `Visuel de partage professionnel, 1200×630, fond #0b0b11. Bureau d'accueil d'une maison funéraire, vu en plan serré : une tablette éteinte posée sur un sous-main en cuir sombre, à côté d'une carte imprimée portant un QR code générique et d'une tasse en porcelaine. Lumière douce de fin de journée par une fenêtre hors champ. Tiers gauche sombre et vide. Reflets dorés très discrets. Aucun texte, aucun logo, aucune personne.`
- **Higgsfield** (image) : `editorial still, 1200x630, funeral home reception desk close-up, dark leather desk pad, switched-off tablet, printed card with a generic QR code, porcelain cup, soft late-afternoon window light from off frame, near-black left third, muted ivory, subtle antique gold reflections on brass desk lamp base, calm and trustworthy, no text, no logo, no people`
- **ChatGPT** (image) : `Image 1200×630 pour une page destinée aux pompes funèbres. Plan serré sur un bureau d'accueil sobre : sous-main en cuir sombre, tablette éteinte, petite carte imprimée avec un QR code générique, tasse en porcelaine blanche. Lumière naturelle douce de fin de journée. Tiers gauche sombre et vide pour un titre. Aucun texte lisible, aucun logo, personne à l'image. Palette noir profond, ivoire, touches d'or patiné.`
- **Grok Imagine** : `1200x630 professional photo, close-up of a calm funeral home reception desk, dark leather pad, turned-off tablet, a printed card with a generic QR code, white porcelain cup, soft warm window light, left third dark and empty, faint antique gold accents, serious and reassuring, no text, no logo, no people`

### A3 — La console des agences sur ordinateur portable

| | |
|---|---|
| Emplacement final | `assets/img/v2/console-portable.webp` (placeholder en place) ; prévu à côté de la médaille dans `/professionnels#console` |
| Format | PNG source 1600 × 1000 → WebP |
| Ratio | 16 : 10 |
| Recommandation | **Préférer une capture réelle** de `/pro?demo=1` (Playwright, 1440 × 900) incrustée dans un ordinateur photographié écran noir : une interface générée serait fausse. Les prompts ci-dessous produisent l'ordinateur et la scène, **écran laissé noir** pour l'incrustation. |

- **Gamma** : `Ordinateur portable ouvert, écran entièrement noir (pour incrustation), posé sur un bureau en noyer sombre dans une pièce feutrée, lumière chaude latérale, une lampe de bureau en laiton hors focus à l'arrière-plan. Cadrage 16:10, trois quarts face. Aucun texte, aucun logo sur l'ordinateur.`
- **Higgsfield** (image) : `product shot, 16:10, open laptop with a pure black screen for compositing, three-quarter view, dark walnut desk, dim refined office, warm side light, out-of-focus brass desk lamp in background, deep shadows, no branding, no text`
- **ChatGPT** (image) : `Photo 1600×1000 d'un ordinateur portable ouvert vu de trois quarts, écran totalement noir et uniforme (il sera remplacé par une capture), sur un bureau en bois sombre, ambiance calme et feutrée, lumière chaude venant de la gauche. Pas de marque visible, pas de texte.`
- **Grok Imagine** : `16:10 photo, open laptop three-quarter view, completely black blank screen for later screen replacement, dark walnut desk, quiet warm-lit office, brass lamp blurred behind, no brand marks, no text`

### A4 — Couverture du kit agence (pack promo PDF)

| | |
|---|---|
| Emplacement final | `assets/img/v2/kit-agence-couverture.webp` (placeholder 1240 × 1754) ; source définitive A4 300 dpi pour `build/pdf-brochure.js` |
| Format | PNG 2480 × 3508 (A4 portrait, 300 dpi) |
| Ratio | 1 : √2 — moitié haute libre pour le titre et le logo de l'agence (co-branding) |

- **Gamma** : `Couverture A4 portrait, fond presque noir. Moitié basse : un bouquet de lys blancs posé sur une pierre sombre polie, lumière rasante chaude qui dessine un liseré doré sur le bord de la pierre. Moitié haute vide et sombre, pour un titre et deux logos. Élégant, sobre, aucun texte.`
- **Higgsfield** (image) : `A4 portrait cover, 2480x3508, lower half: white lilies resting on polished dark stone, warm grazing light creating a thin gold edge on the stone, upper half empty deep black for title and logos, refined, solemn, photorealistic, no text, no logo`
- **ChatGPT** (image) : `Couverture de brochure A4 verticale. En bas, des lys blancs posés sur une dalle de pierre sombre, éclairés par une lumière rasante chaude qui laisse un fin liseré doré. La moitié supérieure reste noire et vide pour un titre et des logos. Aucun texte, aucun logo.`
- **Grok Imagine** : `Vertical A4 brochure cover, white lilies on polished dark stone at the bottom, warm low-angle light leaving a fine golden edge, top half plain black and empty, elegant and calm, no text, no logo`

### A5 — Vidéo de présentation aux agences (30 s) et son poster

| | |
|---|---|
| Emplacement final | `assets/video/v2/presentation-agence.{mp4,webm}` + poster `presentation-agence.webp` (placeholder en place) ; prévue sur `/professionnels` |
| Format | MP4 H.264 1920 × 1080, 30 s, **sans voix** (sous-titres ajoutés ensuite), poster WebP 1920 × 1080 |
| Ratio | 16 : 9 |
| Découpage | 1) mains qui tiennent une photo ancienne (floue) · 2) pupitre, partition, lumière de bougie · 3) salle de cérémonie vide, enceinte discrète · 4) carte QR posée sur une stèle · 5) noir, place pour le logo officiel (incrusté en post-production) |

- **Gamma** : `Storyboard de 5 plans pour une vidéo de 30 secondes destinée aux pompes funèbres, ton recueilli : (1) mains âgées tenant une photographie ancienne floue, (2) pupitre avec partition vierge à la lueur d'une bougie, (3) salle de cérémonie vide et lumineuse, chaises en bois, enceinte discrète, (4) carte avec QR code posée sur une stèle de granit, (5) plan noir final réservé au logo. Palette noir, ivoire, or patiné. Aucun texte dans les images.`
- **Higgsfield** (vidéo) : `30s, 1920x1080, slow dolly moves, five shots: elderly hands holding an old blurred photograph; candlelit lectern with blank sheet music; empty bright ceremony hall with wooden chairs and a discreet speaker; printed QR card resting on a granite headstone; fade to black for logo. Warm low light, shallow depth of field, muted ivory and antique gold, no text, no logo, no faces, gentle and slow`
- **ChatGPT** (image, poster) : `Image 1920×1080, plan d'une salle de cérémonie funéraire vide, lumineuse et sereine, rangées de chaises en bois clair, une enceinte discrète sur un pied, lumière douce par de hautes fenêtres. Aucun texte, aucune personne, aucun symbole religieux.`
- **Grok Imagine** (vidéo) : `30 second calm cinematic sequence, 16:9: old hands holding a blurred vintage photo, a blank music sheet on a lectern by candlelight, an empty sunlit ceremony room with wooden chairs, a QR card on a granite headstone, then black screen. Slow camera, warm muted tones, no text, no logo, no visible faces`

### A6 — (Optionnel) Animation du logo pour l'accueil

| | |
|---|---|
| Emplacement final | remplacerait `assets/img/logo-melodia-anime.mp4` (ancien logo, retiré de l'accueil) |
| Format | MP4 1080 × 1080, 6 s, boucle, < 1,5 Mo |
| **Contrainte** | Le logo doit rester **identique au pixel près**. **Ne pas le faire générer.** Animation en post-production (After Effects, Motion, DaVinci) à partir du fichier officiel : tracé de l'anneau, balayage de lumière. Seul le **fond** peut être généré. |

- **Gamma** : `Fond carré 1080×1080, noir profond #040407, halo de lumière chaude très diffus au centre, grain fin de pellicule. Rien d'autre : aucune forme, aucun texte, aucun logo.`
- **Higgsfield** (vidéo, fond seul) : `6s seamless loop, 1080x1080, deep black background with a very soft warm light breathing slowly at center, fine film grain, nothing else, no shapes, no text, no logo`
- **ChatGPT** (image, fond seul) : `Fond carré 1080×1080 noir profond, avec un halo central de lumière chaude très diffus et un grain fin. Aucune forme, aucun texte, aucun logo.`
- **Grok Imagine** (vidéo, fond seul) : `6 second looping square video, pure deep black with a faint warm glow slowly pulsing in the center, subtle film grain, no objects, no text, no logo`

---

## B. Console Pro (`/pro`, PR #27) — placeholders branchés

Dimensions et procédure de remplacement : `docs/pro-app/ASSETS.md`. Source PNG à déposer dans
`art/<nom>.png`, puis `node scripts/pro-assets.mjs`.

| # | Fichier | Dimensions | Utilisé par | Recommandation |
|---|---|---|---|---|
| B1 | `icon-1024` | 1024 × 1024 | stores, icônes | **Ne pas générer** : dérivé du logo officiel (`scripts/pro-icones-apps.mjs`). |
| B2 | `splash-2732` | 2732 × 2732 | écran de lancement | **Ne pas générer** : logo officiel centré sur `#040407`. |
| B3 | `onboarding-1-questionnaire` | 1280 × 800 | « Ma journée » vide | Scène générée (prompts ci-dessous). |
| B4 | `onboarding-2-composition` | 1280 × 800 | idem, source de `hero-loop` | Scène générée. |
| B5 | `onboarding-3-qr` | 1280 × 800 | idem | Scène générée. |
| B6 | `empty-dossiers` | 960 × 540 | Dossiers vides | Scène générée. |
| B7 | `empty-bibliotheque` | 960 × 540 | Bibliothèque vide | Scène générée. |
| B8 | `empty-qr` | 960 × 540 | QR vide | Scène générée. |
| B9 | `qr-card-mockup` | 1600 × 1200 | promo `/pro` | Carte générée **sans QR** ; QR réel incrusté (studio QR). |
| B10 | `store-bg-phone` | 1080 × 1920 | store, manifeste | Fond généré ; captures réelles incrustées. |
| B11 | `store-bg-tablet` | 2560 × 1600 | idem | idem |
| B12 | `hero-loop` (vidéo) | 1280 × 720, 4 s | accueil `/pro` | Vidéo générée (prompts ci-dessous). |
| B13 | `promo-app-pro` (vidéo) | 1280 × 720, 8 s | écran Aide | Montage de captures réelles, pas de génération. |

### B3 — Le questionnaire (1280 × 800, 16 : 10)
- **Gamma** : `Plan serré, table en bois sombre : un carnet ouvert aux pages vierges, un stylo en laiton, une photographie ancienne retournée, une tasse de thé. Lumière chaude de lampe. Calme, intime. Aucun texte, aucun logo.`
- **Higgsfield** : `16:10 still, dark wooden table, open notebook with blank pages, brass pen, an old photograph face down, cup of tea, warm lamp light, intimate and calm, no text, no logo, no people`
- **ChatGPT** : `Image 1280×800 : sur une table sombre, un carnet ouvert vierge, un stylo en laiton, une vieille photo posée à l'envers et une tasse de thé, sous la lumière chaude d'une lampe. Sans texte ni logo, sans personne.`
- **Grok Imagine** : `1280x800 photo, open blank notebook, brass pen, an old photo lying face down, a cup of tea on a dark wooden table, warm lamplight, quiet mood, no text, no logo, no people`

### B4 — La composition (1280 × 800)
- **Gamma** : `Piano droit ancien dans la pénombre, couvercle ouvert, une partition vierge sur le pupitre, lumière de bougie qui accroche le bord des touches d'un liseré doré. Aucun texte, aucun logo.`
- **Higgsfield** : `16:10 still, old upright piano in near darkness, lid open, blank sheet music on the stand, candlelight catching the key edges with a thin golden line, deep blacks, no text, no logo, no people`
- **ChatGPT** : `Image 1280×800 d'un piano droit ancien dans la pénombre, partition vierge sur le pupitre, une bougie hors champ fait briller finement le bord des touches. Pas de texte, pas de logo, personne.`
- **Grok Imagine** : `1280x800, antique upright piano in dim light, blank music sheet, warm candle glow leaving fine gold highlights on the keys, solemn, no text, no logo, no people`

### B5 — Le QR code (1280 × 800)
- **Gamma** : `Plaque de granit noir poli au cimetière, en fin de journée, un petit carré gravé vierge (emplacement du QR, laissé lisse), quelques feuilles de lierre, lumière rasante dorée. Aucun texte, aucun logo, aucun nom.`
- **Higgsfield** : `16:10 still, polished black granite memorial plaque at golden hour, a small blank engraved square reserved for a QR code (smooth, empty), ivy leaves, low warm light, no text, no names, no logo`
- **ChatGPT** : `Image 1280×800 : plaque funéraire en granit noir poli, au coucher du soleil, avec un petit carré gravé encore vide pour un QR code, quelques feuilles de lierre. Aucun texte, aucun nom, aucun logo.`
- **Grok Imagine** : `1280x800 photo, black polished granite plaque at sunset, small empty engraved square for a future QR code, ivy leaves, warm grazing light, no text, no names, no logo`

### B6 / B7 / B8 — États vides (960 × 540, 16 : 9)
Même série, trois objets : **B6** un classeur en cuir fermé · **B7** une pile de vinyles sans pochette lisible · **B8** une carte blanche vierge sur une stèle.
- **Gamma** : `Nature morte minimaliste, fond #0b0b11, un seul objet au centre-bas : [classeur en cuir fermé | pile de disques vinyles sans inscription | carte blanche vierge sur une pierre sombre], lumière latérale chaude, grand espace vide autour. Aucun texte, aucun logo.`
- **Higgsfield** : `16:9 minimalist still life, near-black background, single object low center: [closed leather folder | stack of unlabeled vinyl records | blank white card on dark stone], warm side light, generous negative space, no text, no logo`
- **ChatGPT** : `Image 960×540, nature morte très épurée sur fond presque noir : [un classeur en cuir fermé | une pile de vinyles sans étiquette | une carte blanche vierge posée sur une pierre sombre], éclairage latéral chaud, beaucoup d'espace vide. Sans texte ni logo.`
- **Grok Imagine** : `960x540 minimalist still life on near-black, one object: [closed leather folder | unlabeled vinyl stack | blank card on dark stone], warm side lighting, lots of empty space, no text, no logo`

### B9 — Carte QR (1600 × 1200, 4 : 3)
- **Gamma** : `Carte imprimée en papier épais ivoire posée sur du lin sombre, bord doré très fin, emplacement carré vide au centre pour un QR code (laisser lisse), une branche d'olivier à côté. Lumière douce. Aucun texte, aucun logo.`
- **Higgsfield** : `4:3 product still, thick ivory card with a very thin gold edge on dark linen, empty square in the center reserved for a QR code, olive branch beside, soft light, no text, no logo`
- **ChatGPT** : `Image 1600×1200 : une carte en papier ivoire épais avec un liseré doré très fin, posée sur un lin sombre, un carré vide au centre pour y placer un QR code, une branche d'olivier à côté. Sans texte ni logo.`
- **Grok Imagine** : `1600x1200, thick ivory card with thin gold border on dark linen, blank square in the middle for a QR code, olive sprig next to it, soft light, no text, no logo`

### B10 / B11 — Fonds de store (1080 × 1920 et 2560 × 1600)
- **Gamma** : `Fond abstrait très sombre, dégradé de #040407 à #101018, un unique filet doré très fin en arc, grain léger. Aucun objet, aucun texte, aucun logo.`
- **Higgsfield** : `abstract background, deep gradient from #040407 to #101018, a single very thin golden arc line, subtle grain, no objects, no text, no logo` (générer aux deux formats)
- **ChatGPT** : `Fond abstrait sombre (dégradé noir vers bleu nuit très foncé) traversé par un seul filet doré très fin en arc de cercle, grain léger. Aucun objet ni texte.`
- **Grok Imagine** : `dark abstract gradient background, near-black to deep navy, one very thin gold arc line, subtle grain, nothing else, no text`

### B12 — `hero-loop` (vidéo 1280 × 720, 4 s, boucle)
- **Gamma** : `Plan fixe, 4 secondes : une partition vierge sur un pupitre, la flamme d'une bougie hors champ fait bouger très lentement la lumière sur le papier. Boucle sans raccord visible. Aucun texte, aucun logo.`
- **Higgsfield** : `4s seamless loop, 1280x720, locked-off shot of blank sheet music on a lectern, off-screen candle flame makes the warm light drift very slowly across the paper, no text, no logo, no people`
- **ChatGPT** (poster) : `Image 1280×720 : partition vierge sur un pupitre, lumière chaude d'une bougie hors champ, ambiance de recueillement. Sans texte ni logo.`
- **Grok Imagine** : `4 second seamless loop, still camera, blank music sheet on a lectern, warm candlelight slowly flickering across the page, calm, no text, no logo`

---

## Ce qui ne doit jamais être généré

- le logo, ses variantes, ses icônes (fichiers officiels seulement) ;
- les **portraits des défunts** du catalogue : ce sont des photos confiées par les familles
  (`assets/img/portraits/`), jamais des images fabriquées ;
- une interface de la console (utiliser des captures réelles de `/pro?demo=1`) ;
- de faux témoignages, de faux visages de clients ou d'équipe.

## Dépôt des fichiers produits

1. Site public : déposer `art/v2/<nom>.png` (noms de la section A), puis
   `PLAYWRIGHT=… CHROME=… node scripts/v2-visuels.mjs` : le fichier fourni remplace le placeholder.
2. Console Pro : `art/<nom>.png` puis `node scripts/pro-assets.mjs` (voir `docs/pro-app/ASSETS.md`).
3. Vidéos : ffmpeg, commandes dans `docs/pro-app/ASSETS.md` (mêmes réglages pour `assets/video/v2/`).
4. Brancher les images de partage (A1, A2) dans `build/p-offres.js` / `build/p-agences.js`, puis
   `npm run pages` et `npm run check`.
5. Vérifier l'absence de métadonnées citant l'outil : `exiftool -all= <fichier>`.
