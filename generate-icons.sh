#!/bin/bash
# Usage: bash generate-icons.sh /path/to/logo-512.png
# Requires: imagemagick (apt install imagemagick)

SOURCE="${1:-/home/admin/web/waiichia.com/public_html/logo.png}"
OUTDIR="/home/admin/web/waiichia.com/public_html/icons"

if [ ! -f "$SOURCE" ]; then
  echo "❌ Image source introuvable: $SOURCE"
  echo "Usage: bash generate-icons.sh /chemin/vers/logo-512.png"
  echo ""
  echo "L'image doit faire au moins 512x512px, format PNG, fond transparent recommandé."
  exit 1
fi

# Installer ImageMagick si nécessaire
which convert > /dev/null 2>&1 || (echo "📦 Installation d'ImageMagick..." && apt install -y imagemagick > /dev/null 2>&1)

mkdir -p "$OUTDIR"

echo "🎨 Génération des icônes PWA..."

for SIZE in 48 72 96 128 144 152 192 256 384 512; do
  convert "$SOURCE" -resize ${SIZE}x${SIZE} -gravity center -extent ${SIZE}x${SIZE} "$OUTDIR/icon-${SIZE}.png"
  echo "  ✅ icon-${SIZE}.png"
done

# Maskable icons (with padding for safe zone — 80% of the icon)
for SIZE in 192 512; do
  INNER=$((SIZE * 80 / 100))
  convert "$SOURCE" -resize ${INNER}x${INNER} -gravity center -background "#0a0e14" -extent ${SIZE}x${SIZE} "$OUTDIR/icon-maskable-${SIZE}.png"
  echo "  ✅ icon-maskable-${SIZE}.png (maskable)"
done

echo ""
echo "✅ Toutes les icônes générées dans $OUTDIR"
echo ""
echo "Prochaine étape :"
echo "  1. Vérifiez les icônes dans $OUTDIR"
echo "  2. Testez sur https://pwabuilder.com avec l'URL https://waiichia.com"
