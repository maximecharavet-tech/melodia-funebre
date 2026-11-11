#!/usr/bin/env bash
# Recompile le noyau Rust de la console Julie v2 et copie le .wasm versionné.
# Prérequis (poste de dev) : rustup + cible wasm32-unknown-unknown (gratuits).
set -euo pipefail
cd "$(dirname "$0")/../console-julie-wasm"
rustup target add wasm32-unknown-unknown >/dev/null 2>&1 || true
cargo test --quiet
cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/julie_v2.wasm ../assets/js/vendor/julie_v2.wasm
cd .. && for t in lib/julie/*.test.cjs; do node --test "$t"; done
node scripts/empreintes.js dashboard-commercial.html
ls -l assets/js/vendor/julie_v2.wasm
