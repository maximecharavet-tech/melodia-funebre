# Visuels et vidéos de la console Pro

Les dossiers `art/` et `video/` n'existaient pas au 11/11/2026 : **tous les
visuels ci-dessous sont des placeholders** (fond `#040407`, filet or, logo
officiel posé tel quel, mention « Visuel provisoire — à remplacer »). Ils ont
les noms et dimensions attendus.

## Remplacer un visuel

1. Déposer le fichier définitif dans `art/` sous son nom (PNG), par exemple `art/empty-dossiers.png`.
2. Lancer `PLAYWRIGHT=/chemin/vers/playwright/index.js node scripts/pro-assets.mjs` : le fichier fourni est préféré au placeholder, converti en WebP (pleine taille + demi-taille pour `srcset`).
3. Lancer `node scripts/pro-icones-apps.mjs` si l'icône ou l'écran de lancement ont changé (icônes Tauri, mipmaps et splash Android).

| Fichier attendu | Dimensions | Sorties | Utilisé par |
|---|---|---|---|
| `art/icon-1024.png` | 1024 × 1024 | `assets/img/pro/icon-1024.{png,webp}` | stores, base des icônes |
| `art/splash-2732.png` | 2732 × 2732 | `assets/img/pro/splash-2732.{png,webp}` | écran de lancement Android |
| `art/onboarding-1-questionnaire.png` | 1280 × 800 | `.webp` + `-640.webp` | « Ma journée » sans dossier |
| `art/onboarding-2-composition.png` | 1280 × 800 | idem | idem, source de `hero-loop` |
| `art/onboarding-3-qr.png` | 1280 × 800 | idem | idem |
| `art/empty-dossiers.png` | 960 × 540 | `.webp` + `-480.webp` | Dossiers (état vide) |
| `art/empty-bibliotheque.png` | 960 × 540 | idem | Bibliothèque (état vide) |
| `art/empty-qr.png` | 960 × 540 | idem | QR & impressions (état vide) |
| `art/qr-card-mockup.png` | 1600 × 1200 | `.webp` + `-800.webp` | source de `promo-app-pro` |
| `art/store-bg-phone.png` | 1080 × 1920 | `.webp` + `-540.webp` | captures du manifeste, store |
| `art/store-bg-tablet.png` | 2560 × 1600 | `.webp` + `-1280.webp` | idem |

Icônes dérivées (jamais redessinées) : `assets/img/pro/icons/pro-192.png`, `pro-512.png`, `pro-maskable-512.png` ; Tauri `apps/desktop/src-tauri/icons/*` ; Android `apps/android/ressources/*` et `android/app/src/main/res/mipmap-*`.

## Vidéos

| Fichier | Format | Utilisé par |
|---|---|---|
| `assets/video/pro/hero-loop.{mp4,webm,webp}` | 1280 × 720, 4 s, sans son | accueil de `/pro` sans session |
| `assets/video/pro/promo-app-pro.{mp4,webm,webp}` | 1280 × 720, 8 s, sans son | écran Aide |

Le `.webp` est le poster. Si la personne a demandé « moins de mouvement » (`prefers-reduced-motion`), seul le poster est affiché.

Pour remplacer : déposer `video/hero-loop.mp4` et `video/promo-app-pro.mp4`, puis (ffmpeg) :

```sh
ffmpeg -i video/hero-loop.mp4 -c:v libx264 -crf 28 -movflags +faststart -an assets/video/pro/hero-loop.mp4
ffmpeg -i assets/video/pro/hero-loop.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -an assets/video/pro/hero-loop.webm
ffmpeg -i assets/video/pro/hero-loop.mp4 -frames:v 1 -c:v libwebp -quality 82 assets/video/pro/hero-loop.webp
```

Les en-têtes de `vercel.json` servent `assets/img/pro/` et `assets/video/pro/` avec une heure de cache (et non un an « immutable ») : un visuel remplacé sous le même nom arrive tout de suite.
