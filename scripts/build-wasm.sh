#!/usr/bin/env bash
# Recompile les noyaux Rust (console Julie v2, Melodia Pro) et copie les .wasm versionnés.
# Prérequis (poste de dev) : rustup + cible wasm32-unknown-unknown (gratuits).
# Facultatif : wasm-opt (binaryen) pour réduire melodia_pro.wasm sous 200 Ko.
# Sans Rust sur le poste : voir melodia-pro-wasm/BUILD.md (conteneur Docker rust:1-bookworm).
set -euo pipefail
RACINE="$(cd "$(dirname "$0")/.." && pwd)"

# ─── Console Julie v2 ─────────────────────────────────────────────────
cd "$RACINE/console-julie-wasm"
rustup target add wasm32-unknown-unknown >/dev/null 2>&1 || true
cargo test --quiet
cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/julie_v2.wasm ../assets/js/vendor/julie_v2.wasm
cd "$RACINE" && for t in lib/julie/*.test.cjs; do node --test "$t"; done
node scripts/empreintes.js dashboard-commercial.html
ls -l assets/js/vendor/julie_v2.wasm

# ─── Melodia Pro ──────────────────────────────────────────────────────
cd "$RACINE/melodia-pro-wasm"
cargo test --quiet
cargo build --target wasm32-unknown-unknown --release
SORTIE="${CARGO_TARGET_DIR:-target}/wasm32-unknown-unknown/release/melodia_pro.wasm"
if command -v wasm-opt >/dev/null 2>&1; then
  wasm-opt -Oz --enable-bulk-memory --enable-sign-ext --enable-nontrapping-float-to-int \
    --enable-mutable-globals "$SORTIE" -o ../assets/js/vendor/melodia_pro.wasm
else
  echo "wasm-opt absent : fichier brut copié (≈ 200 Ko au lieu de ≈ 165 Ko)"
  cp "$SORTIE" ../assets/js/vendor/melodia_pro.wasm
fi
cd "$RACINE"
TAILLE=$(wc -c < assets/js/vendor/melodia_pro.wasm)
echo "melodia_pro.wasm : $TAILLE octets"
if [ "$TAILLE" -gt 204800 ]; then echo "ATTENTION : melodia_pro.wasm dépasse 200 Ko"; fi
node --test tests/pro/*.test.mjs
