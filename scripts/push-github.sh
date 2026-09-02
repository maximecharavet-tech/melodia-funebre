#!/bin/bash
# ═══════════════════════════════════════════════════
# PUSH VERS GITHUB — Melodia Funèbre
# Usage : bash scripts/push-github.sh https://github.com/VOTRE_USER/melodia-funebre.git
# ═══════════════════════════════════════════════════
set -e

REPO_URL="$1"
if [ -z "$REPO_URL" ]; then
  echo "Usage : bash scripts/push-github.sh https://github.com/VOTRE_USER/melodia-funebre.git"
  echo ""
  echo "1. Créez d'abord un repo vide sur github.com (bouton 'New repository')"
  echo "   Nom : melodia-funebre · Private · SANS README"
  echo "2. Copiez son URL et relancez ce script avec."
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main

echo ""
echo "✓ Site poussé sur GitHub : $REPO_URL"
echo ""
echo "PROCHAINES ÉTAPES (déploiement auto) :"
echo "1. vercel.com → Add New → Project → Import ce repo GitHub"
echo "2. Deploy (aucune config nécessaire, site statique)"
echo "3. À chaque 'git push', Vercel redéploie automatiquement."
