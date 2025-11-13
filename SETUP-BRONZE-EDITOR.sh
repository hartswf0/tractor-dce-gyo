#!/bin/bash

# Setup script for Bronze Editor - Real LDraw Geometry Integration
# Run from: /Users/gaia/DCE-GYO

echo "🔧 Setting up Bronze Editor with real LDraw geometry..."

# Step 1: Copy LDrawLoader.js
echo "📦 Step 1/2: Copying LDrawLoader.js..."
mkdir -p examples/js/loaders
cp "wag-viewer-prime-integration-20251112-055341 copy/examples/js/loaders/LDrawLoader.js" \
   examples/js/loaders/LDrawLoader.js

if [ -f "examples/js/loaders/LDrawLoader.js" ]; then
    echo "✓ LDrawLoader.js copied successfully"
else
    echo "❌ Failed to copy LDrawLoader.js"
    exit 1
fi

# Step 2: Link ldraw folder (symlink to save space)
echo "🔗 Step 2/2: Creating ldraw symlink..."

# Remove existing ldraw if it's a broken symlink
if [ -L "ldraw" ] && [ ! -e "ldraw" ]; then
    echo "  Removing broken symlink..."
    rm ldraw
fi

# Create symlink if ldraw doesn't exist
if [ ! -e "ldraw" ]; then
    ln -s "wag-viewer-prime-integration-20251112-055341 copy/ldraw" ldraw
    echo "✓ ldraw symlink created"
else
    echo "✓ ldraw already exists"
fi

# Verify ldraw folder
if [ -d "ldraw/parts" ]; then
    PART_COUNT=$(ls ldraw/parts/*.dat 2>/dev/null | wc -l)
    echo "✓ ldraw/parts/ verified: $PART_COUNT parts available"
else
    echo "❌ ldraw/parts/ not found"
    exit 1
fi

echo ""
echo "🎉 Bronze Editor setup complete!"
echo ""
echo "📂 File Structure:"
echo "   ✓ examples/js/loaders/LDrawLoader.js"
echo "   ✓ ldraw/ -> wag-viewer-prime-integration-20251112-055341 copy/ldraw"
echo "   ✓ ldraw/parts/ (23,515 parts)"
echo ""
echo "🚀 Test it:"
echo "   open wag-bronze-editor.html"
echo "   Load hello-world.mpd"
echo "   Console should show: '✓ LDrawLoader available - real geometry enabled!'"
echo "   You should see REAL MINIFIGS! 🎨"
echo ""
