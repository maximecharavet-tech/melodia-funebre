# Code et outils tiers — Melodia Funèbre Pro

Règle de la maison : on n'embarque que du **MIT, Apache-2.0 ou BSD**, licence
vérifiée à la source (registre Cargo ou npm) avant usage. Aucun code n'a été
copié depuis un projet sous licence incompatible ; les projets cités en
« inspiration » n'ont fourni que des idées, réimplémentées à neuf.

Vérification : licences relues le 11/11/2026 dans les manifestes des paquets
téléchargés (`Cargo.toml` du registre crates.io, `package.json` npm).

## Embarqué dans ce qui est servi ou compilé

| Composant | Version | Licence | Où | Usage |
|---|---|---|---|---|
| `qrcode` (crate) | 0.14.1 | MIT OR Apache-2.0 | `melodia-pro-wasm` → `melodia_pro.wasm` | Encodage QR (niveau H). Fonctions image/svg désactivées : le dessin est écrit par nous. |
| `serde`, `serde_json` | 1.0.229 / 1.0.154 | MIT OR Apache-2.0 | `melodia-pro-wasm`, `apps/desktop` | JSON du contrat ABI. |
| Tauri 2 (`tauri`, `tauri-build`, `tauri-plugin-dialog`, `tauri-plugin-updater` optionnel) | 2.x | MIT OR Apache-2.0 | `apps/desktop` | Application Windows. |
| `base64` (crate) | 0.22 | MIT OR Apache-2.0 | `apps/desktop` | Transfert des fichiers exportés. |
| Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`) | 7.6.10 | MIT | `apps/android` | Application Android. Le projet `android/` est celui que génère `cap add android`, retouché (App Links, icônes, couleurs). |

## Outils de test et de construction (jamais servis)

| Outil | Licence | Usage |
|---|---|---|
| `rqrr` 0.8.0 (et ses dépendances `g2p` MIT/Apache-2.0, `lru` MIT) | MIT OR Apache-2.0 | `cargo test` : relit chaque style de QR pour prouver qu'il se décode. |
| jsQR 1.x | Apache-2.0 | Essais de bout en bout : décodeur **indépendant** qui relit le PNG exporté. Installé hors dépôt. |
| Playwright 1.x | Apache-2.0 | Essais de bout en bout, captures, placeholders. Installé hors dépôt. |
| PGlite (`@electric-sql/pglite`) | Apache-2.0 | Preuves RLS de la migration (`scripts/prouver-migrations.mjs`). Installé hors dépôt. |
| binaryen (`wasm-opt`) | Apache-2.0 | Réduction du `.wasm` (201 → 167 Ko), dans le conteneur de build. |
| ffmpeg (paquet Debian) | LGPL/GPL selon la compilation | Fabrication des vidéos placeholders, dans un conteneur jetable. **Rien de ffmpeg n'est embarqué** : seuls les fichiers vidéo produits le sont. |
| Image Docker `rust:1-bookworm` | Apache-2.0 / MIT (Rust) | Compilation et tests Rust sur un poste sans Rust. |

## Écrit pour la maison, sans dépendance

- Écrivain PDF (`assets/js/pro/pdf.js`) : polices standard du PDF, QR vectoriel, fond perdu et traits de coupe. Aucune bibliothèque PDF.
- Client Stripe (`lib/pro/fournisseurs.mjs`) : appels REST directs et vérification de signature HMAC-SHA256 ; pas de SDK.
- Nettoyage des balises ID3 (`lib/pro/audio.mjs`).
- Rendu QR stylé (modules, yeux, logo, contraste) dans `melodia-pro-wasm/src/qr.rs`.

## Inspiration seulement (aucune ligne copiée)

- `qr-code-styling` (MIT) : l'idée de styles de modules et d'yeux. Notre rendu est réécrit en Rust, et chaque style est prouvé lisible.
- Générateurs de QR et consoles funéraires sous GPL/AGPL : consultés pour l'ergonomie générale, rien n'en a été repris.

## Polices et logos

Polices déjà hébergées par le site (Cormorant Garamond, Jost, JetBrains Mono — OFL, voir `assets/fonts/LICENCE.txt`). Logos officiels de Melodia Funèbre utilisés tels quels, jamais redessinés.
