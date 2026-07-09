#!/bin/bash
# Génère les icônes Tauri pour LBTCode
# Nécessite ImageMagick (convert)

set -e

SRC_DIR="src-tauri/icons"
mkdir -p "$SRC_DIR"

# Crée un SVG du logo LBTCode
cat > /tmp/lbtcode-logo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#06B6D4"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <text x="512" y="680" font-family="system-ui, sans-serif" font-size="560" font-weight="bold" fill="white" text-anchor="middle">L</text>
</svg>
EOF

# Générer les icônes PNG aux tailles requises
echo "Génération des icônes..."
for size in 32 128 256 512 1024; do
  convert /tmp/lbtcode-logo.svg -resize "${size}x${size}" "$SRC_DIR/${size}x${size}.png"
done

# Copier 256x256 en 128x128@2x (pour macOS)
cp "$SRC_DIR/256x256.png" "$SRC_DIR/128x128@2x.png"

# Générer icône macOS (.icns)
# Note: Nécessite iconutil (macOS) ou png2icns
echo "Création de icon.icns (PNG uniquement pour cross-plateforme)..."
cp "$SRC_DIR/1024x1024.png" "$SRC_DIR/icon.png"

# Générer icône Windows (.ico)
echo "Création de icon.ico..."
convert /tmp/lbtcode-logo.svg -resize "256x256" -define icon:auto-resize=32,48,64,128,256 "$SRC_DIR/icon.ico"

# Nettoyage
rm /tmp/lbtcode-logo.svg

echo "Icônes générées dans $SRC_DIR :"
ls -la "$SRC_DIR/"
